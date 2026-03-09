using System.ComponentModel.DataAnnotations;

namespace Tracker.Api.Models;

/// <summary>
/// Represents a sprint belonging to a project.
/// </summary>
public class Sprint
{
    /// <summary>Gets or sets the unique identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the owning project identifier.</summary>
    public Guid ProjectId { get; set; }

    /// <summary>Gets or sets the sprint name.</summary>
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    /// <summary>Gets or sets the optional sprint start date.</summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>Gets or sets the optional sprint end date.</summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>Gets or sets whether this sprint is currently active.</summary>
    public bool IsActive { get; set; } = false;

    /// <summary>Gets or sets the creation timestamp (UTC).</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Gets or sets the last update timestamp (UTC).</summary>
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Project Project { get; set; } = null!;
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}
