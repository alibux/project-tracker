namespace Tracker.Api.DTOs;

/// <summary>
/// Response DTO for a Project resource.
/// </summary>
public class ProjectDto
{
    /// <summary>Unique identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Project name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }

    /// <summary>Creation timestamp (ISO 8601 UTC).</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Last update timestamp (ISO 8601 UTC).</summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request DTO for creating a new Project.
/// </summary>
public class CreateProjectDto
{
    /// <summary>Project name (required, max 255 chars).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional description.</summary>
    public string? Description { get; set; }
}

/// <summary>
/// Request DTO for updating an existing Project.
/// </summary>
public class UpdateProjectDto
{
    /// <summary>Updated project name (required, max 255 chars).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Updated description (set to null to clear).</summary>
    public string? Description { get; set; }
}
