using MeetingScheduler.Api.Data;
using MeetingScheduler.Api.Models;

namespace MeetingScheduler.Api.Stores;

public class UserRoleStore
{
    private readonly ApplicationDbContext _db;

    public UserRoleStore(ApplicationDbContext db)
    {
        _db = db;
    }

    public bool IsAdmin(string upn) => _db.AdminUsers.Any(a => a.Upn == upn);

    public void AddAdmin(string upn)
    {
        if (string.IsNullOrWhiteSpace(upn)) return;
        if (_db.AdminUsers.Any(a => a.Upn == upn)) return;
        _db.AdminUsers.Add(new AdminUser { Upn = upn });
        _db.SaveChanges();
    }

    public IEnumerable<string> GetAllAdmins() => _db.AdminUsers.Select(a => a.Upn).OrderBy(u => u).ToList();
}
