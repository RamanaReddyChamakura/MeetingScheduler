using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MeetingScheduler.Api.Models;
using Microsoft.Identity.Web;

namespace MeetingScheduler.Api.Services;

public class GraphService : IGraphService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly ITokenAcquisition _tokenAcquisition;
    private readonly IConfiguration _config;

    public GraphService(IHttpClientFactory httpFactory, ITokenAcquisition tokenAcquisition, IConfiguration config)
    {
        _httpFactory = httpFactory;
        _tokenAcquisition = tokenAcquisition;
        _config = config;
    }

    private async Task<HttpClient> CreateClientAsync(string[] scopes)
    {
        var token = await _tokenAcquisition.GetAccessTokenForUserAsync(scopes);
        var client = _httpFactory.CreateClient("graph");
        client.BaseAddress = new Uri(_config["Graph:BaseUrl"] ?? "https://graph.microsoft.com/v1.0");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public async Task<bool> IsRoomAvailableAsync(string roomEmail, DateTimeOffset start, DateTimeOffset end, CancellationToken ct)
    {
        var view = await GetAvailabilityViewAsync(roomEmail, start, end, 15, ct);
        // Return true if all free
        return view.All(c => c == '0');
    }

    public async Task<string> GetAvailabilityViewAsync(string roomEmail, DateTimeOffset start, DateTimeOffset end, int intervalMinutes, CancellationToken ct)
    {
        var scopes = (_config["Graph:Scopes"] ?? "Calendars.Read").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var client = await CreateClientAsync(scopes);
        var body = new
        {
            schedules = new[] { roomEmail },
            startTime = new { dateTime = start.ToString("o"), timeZone = "UTC" },
            endTime = new { dateTime = end.ToString("o"), timeZone = "UTC" },
            availabilityViewInterval = intervalMinutes
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, "/me/calendar/getSchedule");
        req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        var res = await client.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        return doc.RootElement.GetProperty("value")[0].GetProperty("availabilityView").GetString() ?? string.Empty;
    }

    public async Task<string> ScheduleMeetingAsync(MeetingRequest request, string organizerUpn, string? roomEmail, CancellationToken ct)
    {
        var scopes = (_config["Graph:Scopes"] ?? "Calendars.ReadWrite").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var client = await CreateClientAsync(scopes);
        var attendees = request.Attendees.Select(a => new { emailAddress = new { address = a }, type = "required" }).ToList();
        if (!string.IsNullOrWhiteSpace(roomEmail))
        {
            attendees.Add(new { emailAddress = new { address = roomEmail }, type = "resource" });
        }

        var evt = new
        {
            subject = request.Subject,
            body = new { contentType = "HTML", content = request.Body ?? string.Empty },
            start = new { dateTime = request.Start.ToString("o"), timeZone = "UTC" },
            end = new { dateTime = request.End.ToString("o"), timeZone = "UTC" },
            attendees = attendees
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, $"/users/{Uri.EscapeDataString(organizerUpn)}/events");
        req.Content = new StringContent(JsonSerializer.Serialize(evt), Encoding.UTF8, "application/json");
        var res = await client.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        return doc.RootElement.GetProperty("id").GetString()!;
    }

    public async Task<IEnumerable<Room>> GetRoomsFromGraphAsync(CancellationToken ct)
    {
        var scopes = (_config["Graph:Scopes"] ?? "Places.Read.All").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var client = await CreateClientAsync(scopes);
        var results = new List<Room>();
        string? nextLink = "/places/microsoft.graph.room?$top=50";
        while (!string.IsNullOrEmpty(nextLink))
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, nextLink);
            var res = await client.SendAsync(req, ct);
            res.EnsureSuccessStatusCode();
            using var stream = await res.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            foreach (var r in doc.RootElement.GetProperty("value").EnumerateArray())
            {
                var name = r.GetProperty("displayName").GetString() ?? string.Empty;
                var email = r.TryGetProperty("emailAddress", out var em) ? em.GetString() ?? string.Empty : string.Empty;
                var capacity = r.TryGetProperty("capacity", out var cap) ? cap.GetInt32() : 0;
                var location = r.TryGetProperty("building", out var b) ? b.GetString() : null;
                results.Add(new Room { Name = name, Email = email, Capacity = capacity, Location = location });
            }
            nextLink = doc.RootElement.TryGetProperty("@odata.nextLink", out var nl) ? nl.GetString() : null;
        }
        return results.Where(r => !string.IsNullOrEmpty(r.Email));
    }
}
