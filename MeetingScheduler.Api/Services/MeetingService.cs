using MeetingScheduler.Api.Models;
using TimeZoneConverter;

namespace MeetingScheduler.Api.Services;

public class MeetingService : IMeetingService
{
    private readonly IRoomService _roomService;
    private readonly IGraphService _graphService;

    public MeetingService(IRoomService roomService, IGraphService graphService)
    {
        _roomService = roomService;
        _graphService = graphService;
    }

    public async Task<string> ScheduleAsync(MeetingRequest request, string organizerUpn, CancellationToken ct)
    {
        if (request.End <= request.Start)
            throw new ArgumentException("End time must be after start time.");

        // Normalize to UTC from provided TimeZoneId
        var tz = TZConvert.GetTimeZoneInfo(request.TimeZoneId);
        var startUtc = TimeZoneInfo.ConvertTime(request.Start.DateTime, tz, TimeZoneInfo.Utc);
        var endUtc = TimeZoneInfo.ConvertTime(request.End.DateTime, tz, TimeZoneInfo.Utc);
        if (endUtc <= startUtc)
            throw new ArgumentException("End time must be after start time.");
        if (startUtc < DateTime.UtcNow)
            throw new ArgumentException("Start time must be in the future.");

        string? roomEmail = null;
        if (request.RoomId.HasValue)
        {
            var room = _roomService.Get(request.RoomId.Value) ?? throw new ArgumentException("Room not found");
            roomEmail = room.Email;
            var available = await _graphService.IsRoomAvailableAsync(roomEmail, startUtc, endUtc, ct);
            if (!available)
                throw new InvalidOperationException("Room is not available for the selected time range.");
        }

        // Create a new request with UTC times for Graph
        var normalized = new MeetingRequest
        {
            Subject = request.Subject,
            Body = request.Body,
            Attendees = request.Attendees,
            Start = new DateTimeOffset(startUtc, TimeSpan.Zero),
            End = new DateTimeOffset(endUtc, TimeSpan.Zero),
            RoomId = request.RoomId,
            TimeZoneId = "UTC"
        };

        return await _graphService.ScheduleMeetingAsync(normalized, organizerUpn, roomEmail, ct);
    }
}
