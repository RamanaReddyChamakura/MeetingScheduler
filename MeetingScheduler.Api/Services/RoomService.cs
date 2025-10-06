using MeetingScheduler.Api.Data;
using MeetingScheduler.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MeetingScheduler.Api.Services;

public class RoomService : IRoomService
{
    private readonly ApplicationDbContext _db;

    public RoomService(ApplicationDbContext db)
    {
        _db = db;
    }

    public IEnumerable<Room> GetAll() => _db.Rooms.AsNoTracking().OrderBy(r => r.Name).ToList();

    public Room? Get(Guid id) => _db.Rooms.Find(id);

    public Room Create(Room room)
    {
        if (string.IsNullOrWhiteSpace(room.Name))
            throw new ArgumentException("Room name is required");
        if (_db.Rooms.Any(r => r.Name == room.Name))
            throw new InvalidOperationException("Room name already exists");
        _db.Rooms.Add(room);
        _db.SaveChanges();
        return room;
    }
}
