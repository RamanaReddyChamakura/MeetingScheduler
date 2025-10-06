using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingScheduler.Api.Services;

namespace MeetingScheduler.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _rooms;

    public RoomsController(IRoomService rooms) => _rooms = rooms;

    [HttpGet]
    public IActionResult GetAll() => Ok(_rooms.GetAll());
}
