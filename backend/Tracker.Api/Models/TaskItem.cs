using System.ComponentModel.DataAnnotations;

namespace Tracker.Api.Models;

/// <summary>
/// Represents a task/card on the kanban board.
/// Named TaskItem to avoid conflict with System.Threading.Tasks.Task.
/// </summary>
public class TaskItem
{
    /// <summary>Gets or sets the unique identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the owning project identifier.</summary>
    public Guid ProjectId { get; set; }

    /// <summary>Gets or sets the optional sprint identifier.</summary>
    public Guid? SprintId { get; set; }

    /// <summary>Gets or sets the task title.</summary>
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = string.Empty;

    /// <summary>Gets or sets the priority. Values: low | medium | high | urgent</summary>
    [MaxLength(20)]
    public string Priority { get; set; } = "medium";

    /// <summary>Gets or sets the task type. Values: feature | bug | chore | spike</summary>
    [MaxLength(20)]
    public string Type { get; set; } = "feature";

    /// <summary>Gets or sets the optional assignee.</summary>
    [MaxLength(255)]
    public string? Assignee { get; set; }

    /// <summary>Gets or sets the board column. Values: Backlog | InProgress | InReview | Done</summary>
    [MaxLength(20)]
    public string Column { get; set; } = "Backlog";

    /// <summary>Gets or sets the sort position within the column.</summary>
    public int Position { get; set; }

    /// <summary>Gets or sets the optional GitHub PR URL.</summary>
    public string? GithubPrUrl { get; set; }

    /// <summary>Gets or sets the optional GitHub Issue URL.</summary>
    public string? GithubIssueUrl { get; set; }

    /// <summary>Gets or sets the creation timestamp (UTC).</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Gets or sets the last update timestamp (UTC).</summary>
    public DateTime UpdatedAt { get; set; }

    // Agent metadata
    /// <summary>Agent key: frontend | backend | ux | qa | main</summary>
    [MaxLength(50)]
    public string? AssigneeAgentKey { get; set; }

    /// <summary>Agent display name, e.g. "Pixel", "Bastion"</summary>
    [MaxLength(100)]
    public string? AssigneeAgentName { get; set; }

    /// <summary>Agent emoji, e.g. "🎨", "🏰"</summary>
    [MaxLength(10)]
    public string? AssigneeAgentEmoji { get; set; }

    /// <summary>Activity status: active | waiting | blocked | reviewing | idle</summary>
    [MaxLength(20)]
    public string? ActivityStatus { get; set; }

    /// <summary>When the agent last updated this task.</summary>
    public DateTime? LastAgentUpdateAt { get; set; }

    /// <summary>Short summary of last agent activity.</summary>
    [MaxLength(500)]
    public string? LastAgentUpdateText { get; set; }

    // Navigation
    public Project Project { get; set; } = null!;
    public Sprint? Sprint { get; set; }
}
