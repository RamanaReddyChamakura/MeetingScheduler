namespace MeetingScheduler.Api.Models;

public class Meeting
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public DateTimeOffset Start { get; set; }
    public DateTimeOffset End { get; set; }
    public string? RoomName { get; set; }
    public Guid? RoomId { get; set; }
}
