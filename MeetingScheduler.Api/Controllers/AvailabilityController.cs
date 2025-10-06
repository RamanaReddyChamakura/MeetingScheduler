using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingScheduler.Api.Services;

namespace MeetingScheduler.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AvailabilityController : ControllerBase
{
    private readonly IGraphService _graph;

    public AvailabilityController(IGraphService graph)
    {
        _graph = graph;
    }

    [HttpGet("rooms/{roomEmail}")]
    public async Task<IActionResult> GetAvailability(string roomEmail, DateTimeOffset start, DateTimeOffset end, int interval = 30, CancellationToken ct = default)
    {
        var view = await _graph.GetAvailabilityViewAsync(roomEmail, start, end, interval, ct);
        return Ok(new { availabilityView = view, interval });
    }
}
