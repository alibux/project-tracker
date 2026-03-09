namespace Tracker.Api.DTOs;

/// <summary>Response DTO for a Sprint resource.</summary>
public class SprintDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Request DTO for creating a sprint.</summary>
public class CreateSprintDto
{
    /// <summary>Sprint name (required, max 255 chars).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Optional start date (ISO 8601 date: YYYY-MM-DD).</summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>Optional end date (ISO 8601 date: YYYY-MM-DD).</summary>
    public DateOnly? EndDate { get; set; }
}

/// <summary>Request DTO for updating a sprint.</summary>
public class UpdateSprintDto
{
    /// <summary>Updated sprint name (required, max 255 chars).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Updated start date (set to null to clear).</summary>
    public DateOnly? StartDate { get; set; }

    /// <summary>Updated end date (set to null to clear).</summary>
    public DateOnly? EndDate { get; set; }
}
