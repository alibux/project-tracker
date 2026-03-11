using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Data;
using Tracker.Api.DTOs;

namespace Tracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AgentsController : ControllerBase
{
    private readonly TrackerDbContext _db;

    private static readonly List<(string Key, string Name, string Emoji)> KnownAgents = new()
    {
        ("main", "Alfred", "🦞"),
        ("backend", "Bastion", "🏰"),
        ("frontend", "Pixel", "🎨"),
        ("ux", "Sage", "🌿"),
        ("qa", "Wraith", "👁️"),
        ("research-analytics", "Oracle", "🔮"),
        ("content-creator", "Spark", "⚡"),
        ("platform-optimizer", "Shift", "🔁"),
        ("scheduler", "Chrono", "⏱️"),
        ("asset-generator", "Flux", "🖼️"),
    };

    public AgentsController(TrackerDbContext db) => _db = db;

    [HttpGet("summary")]
    public async Task<ActionResult<List<AgentSummaryDto>>> GetSummary()
    {
        // Load all tasks with agent keys in one query
        var tasks = await _db.Tasks
            .Where(t => t.AssigneeAgentKey != null)
            .Select(t => new
            {
                t.AssigneeAgentKey,
                t.Column,
                t.ActivityStatus,
                t.LastAgentUpdateAt,
                t.LastAgentUpdateText,
            })
            .ToListAsync();

        var grouped = tasks.GroupBy(t => t.AssigneeAgentKey).ToDictionary(g => g.Key!);

        var result = KnownAgents.Select(agent =>
        {
            var agentTasks = grouped.GetValueOrDefault(agent.Key);

            int active = 0, inReview = 0, done = 0;
            string? currentFocus = null;
            bool isBlocked = false;

            if (agentTasks != null)
            {
                var taskList = agentTasks.ToList();
                active = taskList.Count(t => t.Column == "InProgress");
                inReview = taskList.Count(t => t.Column == "InReview");
                done = taskList.Count(t => t.Column == "Done");
                isBlocked = taskList.Any(t => t.Column == "InProgress" && t.ActivityStatus == "blocked");

                currentFocus = taskList
                    .Where(t => t.Column == "InProgress" && t.LastAgentUpdateText != null)
                    .OrderByDescending(t => t.LastAgentUpdateAt)
                    .Select(t => t.LastAgentUpdateText)
                    .FirstOrDefault();
            }

            string status = isBlocked ? "blocked"
                : active > 0 ? "active"
                : inReview > 0 ? "reviewing"
                : "idle";

            return new AgentSummaryDto
            {
                AgentKey = agent.Key,
                AgentName = agent.Name,
                AgentEmoji = agent.Emoji,
                Status = status,
                ActiveTaskCount = active,
                InReviewTaskCount = inReview,
                DoneTaskCount = done,
                CurrentFocus = currentFocus,
            };
        }).ToList();

        return Ok(result);
    }
}
