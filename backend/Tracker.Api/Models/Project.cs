using System.ComponentModel.DataAnnotations;

namespace Tracker.Api.Models;

/// <summary>
/// Represents a top-level project in the tracker.
/// </summary>
public class Project
{
    /// <summary>Gets or sets the unique identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the project name.</summary>
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Gets or sets the optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Gets or sets the creation timestamp (UTC).</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Gets or sets the last update timestamp (UTC).</summary>
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
