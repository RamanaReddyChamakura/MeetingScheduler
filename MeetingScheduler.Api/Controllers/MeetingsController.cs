using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingScheduler.Api.Models;
using MeetingScheduler.Api.Services;

namespace MeetingScheduler.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MeetingsController : ControllerBase
{
    private readonly IMeetingService _meetings;

    public MeetingsController(IMeetingService meetings)
    {
        _meetings = meetings;
    }

    private string? Upn => User?.Claims?.FirstOrDefault(c => c.Type == "preferred_username" || c.Type.EndsWith("/upn"))?.Value;

    [HttpPost]
    public async Task<IActionResult> Schedule(MeetingRequest request, CancellationToken ct)
    {
        if (Upn is null) return Unauthorized();
        try
        {
            var id = await _meetings.ScheduleAsync(request, Upn, ct);
            return Ok(new { id });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
