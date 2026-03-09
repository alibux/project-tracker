using Microsoft.EntityFrameworkCore;
using Tracker.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Load optional local overrides (gitignored — for credentials, URLs, etc.)
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: false);

// Add EF Core with Npgsql
builder.Services.AddDbContext<TrackerDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("TrackerDatabase")));

// Add controllers
builder.Services.AddControllers();

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Project Tracker API", Version = "v1" });
});

// CORS — allow all origins for local development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Project Tracker API v1");
    c.RoutePrefix = string.Empty; // Serve Swagger UI at root
});

app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }
