using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Tracker.Api.Models;

namespace Tracker.Api.Controllers;

/// <summary>
/// CRUD endpoints for Sprints, plus an activate operation.
/// Only one sprint per project may be active at a time — enforced at the API layer.
/// </summary>
[ApiController]
[Produces("application/json")]
public class SprintsController : ControllerBase
{
    private readonly TrackerDbContext _db;

    /// <inheritdoc />
    public SprintsController(TrackerDbContext db) => _db = db;

    // -------------------------------------------------------------------------
    // GET /api/projects/{projectId}/sprints
    // -------------------------------------------------------------------------

    /// <summary>List all sprints for a project, ordered by creation date.</summary>
    /// <param name="projectId">Owning project GUID.</param>
    [HttpGet("api/projects/{projectId:guid}/sprints")]
    [ProducesResponseType(typeof(IEnumerable<SprintDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAll(Guid projectId)
    {
        var projectExists = await _db.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            return NotFound(BuildProblem(404, "Project not found", $"No project with id '{projectId}' exists."));

        var sprints = await _db.Sprints
            .Where(s => s.ProjectId == projectId)
            .OrderBy(s => s.CreatedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();

        return Ok(sprints);
    }

    // -------------------------------------------------------------------------
    // POST /api/projects/{projectId}/sprints
    // -------------------------------------------------------------------------

    /// <summary>Create a new sprint for a project.</summary>
    /// <param name="projectId">Owning project GUID.</param>
    /// <param name="dto">Sprint creation payload.</param>
    [HttpPost("api/projects/{projectId:guid}/sprints")]
    [ProducesResponseType(typeof(SprintDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(Guid projectId, [FromBody] CreateSprintDto dto)
    {
        var projectExists = await _db.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
            return NotFound(BuildProblem(404, "Project not found", $"No project with id '{projectId}' exists."));

        var validationError = ValidateName(dto.Name);
        if (validationError is not null) return validationError;

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.EndDate < dto.StartDate)
            return BadRequest(BuildProblem(400, "Validation failed", "End date must be on or after start date."));

        var sprint = new Sprint
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = dto.Name.Trim(),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = false
        };

        _db.Sprints.Add(sprint);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = sprint.Id }, MapToDto(sprint));
    }

    // -------------------------------------------------------------------------
    // GET /api/sprints/{id}  (internal — used by CreatedAtAction)
    // -------------------------------------------------------------------------

    /// <summary>Get a single sprint by ID.</summary>
    [HttpGet("api/sprints/{id:guid}")]
    [ProducesResponseType(typeof(SprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var sprint = await _db.Sprints.FindAsync(id);
        if (sprint is null)
            return NotFound(BuildProblem(404, "Sprint not found", $"No sprint with id '{id}' exists."));

        return Ok(MapToDto(sprint));
    }

    // -------------------------------------------------------------------------
    // PUT /api/sprints/{id}
    // -------------------------------------------------------------------------

    /// <summary>Update an existing sprint's name and dates.</summary>
    /// <param name="id">Sprint GUID.</param>
    /// <param name="dto">Sprint update payload.</param>
    [HttpPut("api/sprints/{id:guid}")]
    [ProducesResponseType(typeof(SprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSprintDto dto)
    {
        var sprint = await _db.Sprints.FindAsync(id);
        if (sprint is null)
            return NotFound(BuildProblem(404, "Sprint not found", $"No sprint with id '{id}' exists."));

        var validationError = ValidateName(dto.Name);
        if (validationError is not null) return validationError;

        if (dto.StartDate.HasValue && dto.EndDate.HasValue && dto.EndDate < dto.StartDate)
            return BadRequest(BuildProblem(400, "Validation failed", "End date must be on or after start date."));

        sprint.Name = dto.Name.Trim();
        sprint.StartDate = dto.StartDate;
        sprint.EndDate = dto.EndDate;

        await _db.SaveChangesAsync();

        return Ok(MapToDto(sprint));
    }

    // -------------------------------------------------------------------------
    // DELETE /api/sprints/{id}
    // -------------------------------------------------------------------------

    /// <summary>
    /// Delete a sprint. Tasks in the sprint have their SprintId set to null (unassigned).
    /// </summary>
    /// <param name="id">Sprint GUID.</param>
    [HttpDelete("api/sprints/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var sprint = await _db.Sprints.FindAsync(id);
        if (sprint is null)
            return NotFound(BuildProblem(404, "Sprint not found", $"No sprint with id '{id}' exists."));

        // Unassign tasks from this sprint before deleting
        var tasks = await _db.Tasks.Where(t => t.SprintId == id).ToListAsync();
        foreach (var task in tasks)
            task.SprintId = null;

        _db.Sprints.Remove(sprint);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // -------------------------------------------------------------------------
    // POST /api/sprints/{id}/activate
    // -------------------------------------------------------------------------

    /// <summary>
    /// Activate a sprint for its project. Deactivates any currently active sprint first.
    /// Only one sprint per project may be active at a time.
    /// </summary>
    /// <param name="id">Sprint GUID to activate.</param>
    [HttpPost("api/sprints/{id:guid}/activate")]
    [ProducesResponseType(typeof(SprintDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(Guid id)
    {
        var sprint = await _db.Sprints.FindAsync(id);
        if (sprint is null)
            return NotFound(BuildProblem(404, "Sprint not found", $"No sprint with id '{id}' exists."));

        // Deactivate all other sprints in the same project
        var activeSprints = await _db.Sprints
            .Where(s => s.ProjectId == sprint.ProjectId && s.IsActive && s.Id != id)
            .ToListAsync();

        foreach (var active in activeSprints)
            active.IsActive = false;

        sprint.IsActive = true;

        await _db.SaveChangesAsync();

        return Ok(MapToDto(sprint));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ObjectResult? ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(BuildProblem(400, "Validation failed", "The 'name' field is required and cannot be empty."));

        if (name.Length > 255)
            return BadRequest(BuildProblem(400, "Validation failed", "The 'name' field must not exceed 255 characters."));

        return null;
    }

    private static SprintDto MapToDto(Sprint s) => new()
    {
        Id = s.Id,
        ProjectId = s.ProjectId,
        Name = s.Name,
        StartDate = s.StartDate,
        EndDate = s.EndDate,
        IsActive = s.IsActive,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };

    private static ProblemDetails BuildProblem(int status, string title, string detail) => new()
    {
        Type = $"https://httpstatuses.io/{status}",
        Title = title,
        Status = status,
        Detail = detail
    };
}
