namespace Tracker.Api.DTOs;

public class AgentSummaryDto
{
    public string AgentKey { get; set; } = string.Empty;
    public string AgentName { get; set; } = string.Empty;
    public string AgentEmoji { get; set; } = string.Empty;
    public string Status { get; set; } = "idle";
    public int ActiveTaskCount { get; set; }
    public int InReviewTaskCount { get; set; }
    public int DoneTaskCount { get; set; }
    public string? CurrentFocus { get; set; }
}
