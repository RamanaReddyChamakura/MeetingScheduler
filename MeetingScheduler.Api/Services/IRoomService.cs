using MeetingScheduler.Api.Models;

namespace MeetingScheduler.Api.Services;

public interface IRoomService
{
    IEnumerable<Room> GetAll();
    Room? Get(Guid id);
    Room Create(Room room);
}
