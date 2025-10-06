using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingScheduler.Api.Stores;
using MeetingScheduler.Api.Models;
using MeetingScheduler.Api.Services;

namespace MeetingScheduler.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly UserRoleStore _roles;
    private readonly IRoomService _rooms;
    private readonly IGraphService _graph;

    public AdminController(UserRoleStore roles, IRoomService rooms, IGraphService graph)
    {
        _roles = roles; _rooms = rooms; _graph = graph;
    }

    private string? CurrentUpn => User?.Claims?.FirstOrDefault(c => c.Type == "preferred_username" || c.Type.EndsWith("/upn"))?.Value;

    private bool EnsureAdmin()
    {
        var upn = CurrentUpn;
        return !string.IsNullOrWhiteSpace(upn) && _roles.IsAdmin(upn);
    }

    [HttpGet("am-i-admin")]
    public IActionResult AmIAdmin() => Ok(new { isAdmin = EnsureAdmin() });

    [HttpGet("admins")]
    public IActionResult GetAdmins()
    {
        if (!EnsureAdmin()) return Forbid();
        return Ok(_roles.GetAllAdmins());
    }

    [HttpPost("grant-admin")]
    public IActionResult GrantAdmin([FromBody] string upn)
    {
        if (!EnsureAdmin()) return Forbid();
        _roles.AddAdmin(upn);
        return Ok();
    }

    [HttpPost("rooms")]
    public ActionResult<Room> CreateRoom([FromBody] Room room)
    {
        if (!EnsureAdmin()) return Forbid();
        try
        {
            var created = _rooms.Create(room);
            return CreatedAtAction(nameof(GetRoom), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("rooms/{id}")]
    public ActionResult<Room> GetRoom(Guid id)
    {
        if (!EnsureAdmin()) return Forbid();
        var room = _rooms.Get(id);
        return room is null ? NotFound() : Ok(room);
    }

    [HttpPost("seed-rooms")]
    public async Task<IActionResult> SeedRooms(CancellationToken ct)
    {
        if (!EnsureAdmin()) return Forbid();
        var existing = _rooms.GetAll().ToList();
        var imported = await _graph.GetRoomsFromGraphAsync(ct);
        int added = 0;
        foreach (var r in imported)
        {
            if (existing.Any(e => e.Email.Equals(r.Email, StringComparison.OrdinalIgnoreCase))) continue;
            try { _rooms.Create(r); added++; } catch { /* ignore duplicates */ }
        }
        return Ok(new { added });
    }
}
