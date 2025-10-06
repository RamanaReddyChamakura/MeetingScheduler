using System.ComponentModel.DataAnnotations;

namespace MeetingScheduler.Api.Models;

public class MeetingRequest
{
    [Required, StringLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public DateTimeOffset Start { get; set; }

    [Required]
    public DateTimeOffset End { get; set; }

    [StringLength(4000)]
    public string? Body { get; set; }

    public IList<string> Attendees { get; set; } = new List<string>();

    public Guid? RoomId { get; set; }

    // Client timezone id (IANA or Windows). Backend will normalize to UTC using TimeZoneConverter.
    [Required, StringLength(100)]
    public string TimeZoneId { get; set; } = "UTC";
}
