using MeetingScheduler.Api.Models;

namespace MeetingScheduler.Api.Services;

public interface IMeetingService
{
    Task<string> ScheduleAsync(MeetingRequest request, string organizerUpn, CancellationToken ct);
}
