using Microsoft.EntityFrameworkCore;
using MeetingScheduler.Api.Models;

namespace MeetingScheduler.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Room>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.Name).IsRequired();
            b.HasIndex(r => r.Name).IsUnique();
            b.Property(r => r.Capacity);
            b.Property(r => r.Location);
            b.Property(r => r.EquipmentJson);
        });
        modelBuilder.Entity<AdminUser>(b =>
        {
            b.HasKey(a => a.Id);
            b.HasIndex(a => a.Upn).IsUnique();
            b.Property(a => a.Upn).IsRequired();
        });
    }
}
