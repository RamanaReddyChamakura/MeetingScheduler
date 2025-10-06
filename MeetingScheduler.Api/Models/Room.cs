namespace MeetingScheduler.Api.Models;

public class Room
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string? Location { get; set; }

    // Persisted as JSON in EF Core (simple approach without a value converter for now)
    public string EquipmentJson { get; set; } = "[]";

    public IList<string> Equipment
    {
        get => System.Text.Json.JsonSerializer.Deserialize<IList<string>>(EquipmentJson) ?? new List<string>();
        set => EquipmentJson = System.Text.Json.JsonSerializer.Serialize(value ?? new List<string>());
    }
}
