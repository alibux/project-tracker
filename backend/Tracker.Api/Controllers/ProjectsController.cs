using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Tracker.Api.Models;

namespace Tracker.Api.Controllers;

/// <summary>
/// CRUD endpoints for Projects.
/// </summary>
[ApiController]
[Route("api/projects")]
[Produces("application/json")]
public class ProjectsController : ControllerBase
{
    private readonly TrackerDbContext _db;

    /// <inheritdoc />
    public ProjectsController(TrackerDbContext db)
    {
        _db = db;
    }

    // -------------------------------------------------------------------------
    // GET /api/projects
    // -------------------------------------------------------------------------

    /// <summary>List all projects.</summary>
    /// <returns>A list of all projects ordered by creation date descending.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProjectDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var projects = await _db.Projects
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapToDto(p))
            .ToListAsync();

        return Ok(projects);
    }

    // -------------------------------------------------------------------------
    // GET /api/projects/{id}
    // -------------------------------------------------------------------------

    /// <summary>Get a single project by ID.</summary>
    /// <param name="id">Project GUID.</param>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var project = await _db.Projects.FindAsync(id);

        if (project is null)
            return NotFound(BuildProblem(404, "Project not found", $"No project with id '{id}' exists."));

        return Ok(MapToDto(project));
    }

    // -------------------------------------------------------------------------
    // POST /api/projects
    // -------------------------------------------------------------------------

    /// <summary>Create a new project.</summary>
    /// <param name="dto">Project creation payload.</param>
    [HttpPost]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(BuildProblem(400, "Validation failed", "The 'name' field is required and cannot be empty."));

        if (dto.Name.Length > 255)
            return BadRequest(BuildProblem(400, "Validation failed", "The 'name' field must not exceed 255 characters."));

        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim()
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = project.Id }, MapToDto(project));
    }

    // -------------------------------------------------------------------------
    // PUT /api/projects/{id}
    // -------------------------------------------------------------------------

    /// <summary>Update an existing project.</summary>
    /// <param name="id">Project GUID.</param>
    /// <param name="dto">Project update payload.</param>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(BuildProblem(400, "Validation failed", "The 'name' field is required and cannot be empty."));

        if (dto.Name.Length > 255)
            return BadRequest(BuildProblem(400, "Validation failed", "The 'name' field must not exceed 255 characters."));

        var project = await _db.Projects.FindAsync(id);

        if (project is null)
            return NotFound(BuildProblem(404, "Project not found", $"No project with id '{id}' exists."));

        project.Name = dto.Name.Trim();
        project.Description = dto.Description?.Trim();

        await _db.SaveChangesAsync();

        return Ok(MapToDto(project));
    }

    // -------------------------------------------------------------------------
    // DELETE /api/projects/{id}
    // -------------------------------------------------------------------------

    /// <summary>
    /// Delete a project and all associated sprints and tasks.
    /// Cascade delete is handled at the database level via EF Core configuration.
    /// </summary>
    /// <param name="id">Project GUID.</param>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var project = await _db.Projects.FindAsync(id);

        if (project is null)
            return NotFound(BuildProblem(404, "Project not found", $"No project with id '{id}' exists."));

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static ProjectDto MapToDto(Project p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    private static ProblemDetails BuildProblem(int status, string title, string detail) => new()
    {
        Type = $"https://httpstatuses.io/{status}",
        Title = title,
        Status = status,
        Detail = detail
    };
}
