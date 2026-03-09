using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Tracker.Api.Models;

namespace Tracker.Api.Controllers;

/// <summary>
/// GET and PUT endpoints for the singleton Settings record.
/// If no settings row exists, GET auto-creates one with defaults.
/// </summary>
[ApiController]
[Route("api/settings")]
[Produces("application/json")]
public class SettingsController : ControllerBase
{
    // HH:mm 24-hour format
    private static readonly Regex DigestTimeRegex = new(@"^([01]\d|2[0-3]):[0-5]\d$", RegexOptions.Compiled);

    private readonly TrackerDbContext _db;

    /// <inheritdoc />
    public SettingsController(TrackerDbContext db) => _db = db;

    // -------------------------------------------------------------------------
    // GET /api/settings
    // -------------------------------------------------------------------------

    /// <summary>
    /// Get current application settings.
    /// Auto-creates the singleton row with defaults if it does not yet exist.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get()
    {
        var settings = await GetOrCreateSettingsAsync();
        return Ok(MapToDto(settings));
    }

    // -------------------------------------------------------------------------
    // PUT /api/settings
    // -------------------------------------------------------------------------

    /// <summary>
    /// Update application settings.
    /// The singleton row is created if it does not yet exist.
    /// </summary>
    /// <param name="dto">Settings update payload.</param>
    [HttpPut]
    [ProducesResponseType(typeof(SettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromBody] UpdateSettingsDto dto)
    {
        // Validate digestTime format
        if (!DigestTimeRegex.IsMatch(dto.DigestTime))
            return BadRequest(BuildProblem(400, "Validation failed",
                $"Invalid digestTime '{dto.DigestTime}'. Must be in HH:mm 24-hour format (e.g. '09:00', '18:30')."));

        // Validate defaultProjectId references a real project (if provided)
        if (dto.DefaultProjectId.HasValue)
        {
            var projectExists = await _db.Projects.AnyAsync(p => p.Id == dto.DefaultProjectId.Value);
            if (!projectExists)
                return NotFound(BuildProblem(404, "Project not found",
                    $"No project with id '{dto.DefaultProjectId}' exists. Cannot set as default project."));
        }

        var settings = await GetOrCreateSettingsAsync();

        settings.DefaultProjectId = dto.DefaultProjectId;
        settings.TelegramChatId = dto.TelegramChatId?.Trim();
        settings.DigestTime = dto.DigestTime;
        settings.GithubWebhookSecret = dto.GithubWebhookSecret?.Trim();

        await _db.SaveChangesAsync();

        return Ok(MapToDto(settings));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Returns the single settings row, creating it with defaults if absent.
    /// This ensures GET and PUT never fail due to a missing row.
    /// </summary>
    private async Task<Settings> GetOrCreateSettingsAsync()
    {
        var settings = await _db.Settings.FirstOrDefaultAsync();

        if (settings is null)
        {
            settings = new Settings
            {
                Id = Guid.NewGuid(),
                DigestTime = "09:00"
            };
            _db.Settings.Add(settings);
            await _db.SaveChangesAsync();
        }

        return settings;
    }

    private static SettingsDto MapToDto(Settings s) => new()
    {
        Id = s.Id,
        DefaultProjectId = s.DefaultProjectId,
        TelegramChatId = s.TelegramChatId,
        DigestTime = s.DigestTime,
        GithubWebhookSecret = s.GithubWebhookSecret
    };

    private static ProblemDetails BuildProblem(int status, string title, string detail) => new()
    {
        Type = $"https://httpstatuses.io/{status}",
        Title = title,
        Status = status,
        Detail = detail
    };
}
