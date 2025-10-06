using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using MeetingScheduler.Api.Data;
using MeetingScheduler.Api.Services;
using MeetingScheduler.Api.Stores;

var builder = WebApplication.CreateBuilder(args);

// Configuration
var config = builder.Configuration;

// EF Core
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var cs = config.GetConnectionString("Default") ?? "Server=(localdb)\\MSSQLLocalDB;Database=MeetingSchedulerDb;Trusted_Connection=True;TrustServerCertificate=True";
    options.UseSqlServer(cs);
});

// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(config.GetSection("AzureAd"))
    .EnableTokenAcquisitionToCallDownstreamApi()
    .AddInMemoryTokenCaches();

builder.Services.AddAuthorization();

builder.Services.AddHttpContextAccessor();

builder.Services.AddHttpClient();
builder.Services.AddHttpClient("graph");

builder.Services.AddControllers();

// OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// CORS for Angular dev server
const string ClientCors = "ClientCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(ClientCors, policy =>
    {
        policy.WithOrigins(
                config["ClientApp:BaseUrl"] ?? "http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// DI registrations
builder.Services.AddScoped<UserRoleStore>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IGraphService, GraphService>();
builder.Services.AddScoped<IMeetingService, MeetingService>();

var app = builder.Build();

// DB initialize and seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();

    // Seed default admin
    var defaultAdminUpn = config["DefaultAdmin:Upn"];
    if (!string.IsNullOrWhiteSpace(defaultAdminUpn) && !db.AdminUsers.Any(a => a.Upn == defaultAdminUpn))
    {
        db.AdminUsers.Add(new MeetingScheduler.Api.Models.AdminUser { Upn = defaultAdminUpn });
        db.SaveChanges();
    }

    // Seed rooms from Graph Places if empty and we can acquire a token (requires first user login to cache token)
    if (!db.Rooms.Any())
    {
        try
        {
            var graph = scope.ServiceProvider.GetRequiredService<IGraphService>();
            // Note: for delegated OBO, tokens require a signed-in user context.
            // This startup seed will be a no-op until the first authenticated call is made which creates a user token cache.
            var rooms = await graph.GetRoomsFromGraphAsync(CancellationToken.None);
            foreach (var r in rooms)
            {
                if (!db.Rooms.Any(x => x.Email == r.Email))
                {
                    db.Rooms.Add(r);
                }
            }
            db.SaveChanges();
        }
        catch
        {
            // Ignore failures at startup; admin can trigger seed via API later
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(ClientCors);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
