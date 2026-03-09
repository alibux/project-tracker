namespace Tracker.Api.DTOs;

/// <summary>
/// Response DTO for a TaskItem resource.
/// </summary>
public class TaskDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? SprintId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public string Type { get; set; } = "feature";
    public string? Assignee { get; set; }
    public string Column { get; set; } = "Backlog";
    public int Position { get; set; }
    public string? GithubPrUrl { get; set; }
    public string? GithubIssueUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request DTO for creating a new task.
/// </summary>
public class CreateTaskDto
{
    /// <summary>Owning project (required).</summary>
    public Guid ProjectId { get; set; }

    /// <summary>Optional sprint assignment.</summary>
    public Guid? SprintId { get; set; }

    /// <summary>Task title (required, max 500 chars).</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Priority: low | medium | high | urgent. Defaults to medium.</summary>
    public string Priority { get; set; } = "medium";

    /// <summary>Type: feature | bug | chore | spike. Defaults to feature.</summary>
    public string Type { get; set; } = "feature";

    /// <summary>Optional assignee name.</summary>
    public string? Assignee { get; set; }

    /// <summary>Column: Backlog | InProgress | InReview | Done. Defaults to Backlog.</summary>
    public string Column { get; set; } = "Backlog";

    /// <summary>Optional GitHub PR URL.</summary>
    public string? GithubPrUrl { get; set; }

    /// <summary>Optional GitHub Issue URL.</summary>
    public string? GithubIssueUrl { get; set; }
}

/// <summary>
/// Request DTO for updating an existing task.
/// </summary>
public class UpdateTaskDto
{
    public Guid? SprintId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public string Type { get; set; } = "feature";
    public string? Assignee { get; set; }
    public string Column { get; set; } = "Backlog";
    public string? GithubPrUrl { get; set; }
    public string? GithubIssueUrl { get; set; }
}

/// <summary>
/// Request DTO for the PATCH move operation.
/// </summary>
public class MoveTaskDto
{
    /// <summary>Target column: Backlog | InProgress | InReview | Done.</summary>
    public string Column { get; set; } = string.Empty;

    /// <summary>New position within the column. When null, task is appended to the end of the target column.</summary>
    public int? Position { get; set; }
}
