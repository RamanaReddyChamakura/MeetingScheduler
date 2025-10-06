using MeetingScheduler.Api.Models;

namespace MeetingScheduler.Api.Services;

public interface IGraphService
{
    Task<bool> IsRoomAvailableAsync(string roomEmail, DateTimeOffset start, DateTimeOffset end, CancellationToken ct);
    Task<string> ScheduleMeetingAsync(MeetingRequest request, string organizerUpn, string? roomEmail, CancellationToken ct);
    Task<IEnumerable<Room>> GetRoomsFromGraphAsync(CancellationToken ct);
    Task<string> GetAvailabilityViewAsync(string roomEmail, DateTimeOffset start, DateTimeOffset end, int intervalMinutes, CancellationToken ct);
}
