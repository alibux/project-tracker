using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Tracker.Api.Models;

namespace Tracker.Api.Controllers;

/// <summary>
/// CRUD endpoints for Tasks, plus a move operation for Kanban drag-and-drop.
/// </summary>
[ApiController]
[Route("api/tasks")]
[Produces("application/json")]
public class TasksController : ControllerBase
{
    // Valid enum values — enforced at API layer (stored as strings per spec)
    private static readonly HashSet<string> ValidPriorities = ["low", "medium", "high", "urgent"];
    private static readonly HashSet<string> ValidTypes = ["feature", "bug", "chore", "spike"];
    private static readonly HashSet<string> ValidColumns = ["Backlog", "InProgress", "InReview", "Done"];

    private readonly TrackerDbContext _db;

    /// <inheritdoc />
    public TasksController(TrackerDbContext db) => _db = db;

    // -------------------------------------------------------------------------
    // GET /api/tasks?projectId=&sprintId=
    // -------------------------------------------------------------------------

    /// <summary>
    /// List tasks. Optionally filter by projectId and/or sprintId.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] Guid? projectId, [FromQuery] Guid? sprintId)
    {
        var query = _db.Tasks.AsQueryable();

        if (projectId.HasValue)
            query = query.Where(t => t.ProjectId == projectId.Value);

        if (sprintId.HasValue)
            query = query.Where(t => t.SprintId == sprintId.Value);

        var tasks = await query
            .OrderBy(t => t.Column)
            .ThenBy(t => t.Position)
            .Select(t => MapToDto(t))
            .ToListAsync();

        return Ok(tasks);
    }

    // -------------------------------------------------------------------------
    // GET /api/tasks/{id}
    // -------------------------------------------------------------------------

    /// <summary>Get a single task by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var task = await _db.Tasks.FindAsync(id);

        if (task is null)
            return NotFound(BuildProblem(404, "Task not found", $"No task with id '{id}' exists."));

        return Ok(MapToDto(task));
    }

    // -------------------------------------------------------------------------
    // POST /api/tasks
    // -------------------------------------------------------------------------

    /// <summary>Create a new task.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
    {
        var validationError = ValidateTaskFields(dto.Title, dto.Priority, dto.Type, dto.Column);
        if (validationError is not null) return validationError;

        // Verify project exists
        var projectExists = await _db.Projects.AnyAsync(p => p.Id == dto.ProjectId);
        if (!projectExists)
            return NotFound(BuildProblem(404, "Project not found", $"No project with id '{dto.ProjectId}' exists."));

        // Verify sprint exists and belongs to the project (if provided)
        if (dto.SprintId.HasValue)
        {
            var sprintValid = await _db.Sprints.AnyAsync(s => s.Id == dto.SprintId.Value && s.ProjectId == dto.ProjectId);
            if (!sprintValid)
                return NotFound(BuildProblem(404, "Sprint not found", $"No sprint with id '{dto.SprintId}' exists in this project."));
        }

        // Assign position at end of target column (highest + 1000)
        var maxPosition = await _db.Tasks
            .Where(t => t.ProjectId == dto.ProjectId && t.Column == dto.Column)
            .Select(t => (int?)t.Position)
            .MaxAsync() ?? 0;

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            ProjectId = dto.ProjectId,
            SprintId = dto.SprintId,
            Title = dto.Title.Trim(),
            Priority = dto.Priority,
            Type = dto.Type,
            Assignee = dto.Assignee?.Trim(),
            Column = dto.Column,
            Position = maxPosition + 1000,
            GithubPrUrl = dto.GithubPrUrl?.Trim(),
            GithubIssueUrl = dto.GithubIssueUrl?.Trim()
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = task.Id }, MapToDto(task));
    }

    // -------------------------------------------------------------------------
    // PUT /api/tasks/{id}
    // -------------------------------------------------------------------------

    /// <summary>Update an existing task.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskDto dto)
    {
        var validationError = ValidateTaskFields(dto.Title, dto.Priority, dto.Type, dto.Column);
        if (validationError is not null) return validationError;

        var task = await _db.Tasks.FindAsync(id);
        if (task is null)
            return NotFound(BuildProblem(404, "Task not found", $"No task with id '{id}' exists."));

        // Verify sprint belongs to the task's project (if being changed)
        if (dto.SprintId.HasValue)
        {
            var sprintValid = await _db.Sprints.AnyAsync(s => s.Id == dto.SprintId.Value && s.ProjectId == task.ProjectId);
            if (!sprintValid)
                return NotFound(BuildProblem(404, "Sprint not found", $"No sprint with id '{dto.SprintId}' exists in this project."));
        }

        task.SprintId = dto.SprintId;
        task.Title = dto.Title.Trim();
        task.Priority = dto.Priority;
        task.Type = dto.Type;
        task.Assignee = dto.Assignee?.Trim();
        task.Column = dto.Column;
        task.GithubPrUrl = dto.GithubPrUrl?.Trim();
        task.GithubIssueUrl = dto.GithubIssueUrl?.Trim();

        await _db.SaveChangesAsync();

        return Ok(MapToDto(task));
    }

    // -------------------------------------------------------------------------
    // DELETE /api/tasks/{id}
    // -------------------------------------------------------------------------

    /// <summary>Delete a task.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await _db.Tasks.FindAsync(id);
        if (task is null)
            return NotFound(BuildProblem(404, "Task not found", $"No task with id '{id}' exists."));

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // -------------------------------------------------------------------------
    // PATCH /api/tasks/{id}/move
    // -------------------------------------------------------------------------

    /// <summary>
    /// Move a task to a new column and/or position (Kanban drag-and-drop).
    /// Rebalances positions in the target column if a collision is detected.
    /// </summary>
    [HttpPatch("{id:guid}/move")]
    [ProducesResponseType(typeof(TaskDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Move(Guid id, [FromBody] MoveTaskDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Column) || !ValidColumns.Contains(dto.Column))
            return BadRequest(BuildProblem(400, "Validation failed", $"Invalid column '{dto.Column}'. Must be one of: {string.Join(", ", ValidColumns)}."));

        if (dto.Position <= 0)
            return BadRequest(BuildProblem(400, "Validation failed", "Position must be a positive integer."));

        var task = await _db.Tasks.FindAsync(id);
        if (task is null)
            return NotFound(BuildProblem(404, "Task not found", $"No task with id '{id}' exists."));

        // Check for position collision in the target column (excluding this task)
        var collision = await _db.Tasks.AnyAsync(t =>
            t.Id != id &&
            t.ProjectId == task.ProjectId &&
            t.Column == dto.Column &&
            t.Position == dto.Position);

        if (collision)
        {
            // Rebalance: shift all tasks at or after the desired position up by 1000
            var tasksToShift = await _db.Tasks
                .Where(t => t.Id != id && t.ProjectId == task.ProjectId && t.Column == dto.Column && t.Position >= dto.Position)
                .OrderBy(t => t.Position)
                .ToListAsync();

            foreach (var t in tasksToShift)
                t.Position += 1000;
        }

        task.Column = dto.Column;
        task.Position = dto.Position;

        await _db.SaveChangesAsync();

        return Ok(MapToDto(task));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private ObjectResult? ValidateTaskFields(string title, string priority, string type, string column)
    {
        if (string.IsNullOrWhiteSpace(title))
            return BadRequest(BuildProblem(400, "Validation failed", "The 'title' field is required and cannot be empty."));

        if (title.Length > 500)
            return BadRequest(BuildProblem(400, "Validation failed", "The 'title' field must not exceed 500 characters."));

        if (!ValidPriorities.Contains(priority))
            return BadRequest(BuildProblem(400, "Validation failed", $"Invalid priority '{priority}'. Must be one of: {string.Join(", ", ValidPriorities)}."));

        if (!ValidTypes.Contains(type))
            return BadRequest(BuildProblem(400, "Validation failed", $"Invalid type '{type}'. Must be one of: {string.Join(", ", ValidTypes)}."));

        if (!ValidColumns.Contains(column))
            return BadRequest(BuildProblem(400, "Validation failed", $"Invalid column '{column}'. Must be one of: {string.Join(", ", ValidColumns)}."));

        return null;
    }

    private static TaskDto MapToDto(TaskItem t) => new()
    {
        Id = t.Id,
        ProjectId = t.ProjectId,
        SprintId = t.SprintId,
        Title = t.Title,
        Priority = t.Priority,
        Type = t.Type,
        Assignee = t.Assignee,
        Column = t.Column,
        Position = t.Position,
        GithubPrUrl = t.GithubPrUrl,
        GithubIssueUrl = t.GithubIssueUrl,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt
    };

    private static ProblemDetails BuildProblem(int status, string title, string detail) => new()
    {
        Type = $"https://httpstatuses.io/{status}",
        Title = title,
        Status = status,
        Detail = detail
    };
}
