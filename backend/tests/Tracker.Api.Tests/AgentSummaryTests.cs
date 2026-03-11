using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Controllers;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Tracker.Api.Models;
using Xunit;

namespace Tracker.Api.Tests;

public class AgentSummaryTests : IDisposable
{
    private readonly TrackerDbContext _db;
    private readonly AgentsController _controller;

    public AgentSummaryTests()
    {
        var options = new DbContextOptionsBuilder<TrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _db = new TrackerDbContext(options);
        _controller = new AgentsController(_db);
    }

    public void Dispose() => _db.Dispose();

    private async Task<Guid> SeedProject()
    {
        var project = new Project { Id = Guid.NewGuid(), Name = "Test", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        return project.Id;
    }

    [Fact]
    public async Task ReturnsAllKnownAgents_WhenNoTasksExist()
    {
        var result = await _controller.GetSummary();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var agents = Assert.IsType<List<AgentSummaryDto>>(ok.Value);
        Assert.Equal(10, agents.Count);
        Assert.Contains(agents, a => a.AgentKey == "main" && a.AgentName == "Alfred");
        Assert.Contains(agents, a => a.AgentKey == "frontend" && a.AgentEmoji == "🎨");
    }

    [Fact]
    public async Task CorrectActiveTaskCount_ForInProgressTasks()
    {
        var pid = await SeedProject();
        _db.Tasks.AddRange(
            new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "T1", Column = "InProgress", AssigneeAgentKey = "backend", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "T2", Column = "InProgress", AssigneeAgentKey = "backend", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "T3", Column = "Done", AssigneeAgentKey = "backend", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _db.SaveChangesAsync();

        var result = await _controller.GetSummary();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var agents = Assert.IsType<List<AgentSummaryDto>>(ok.Value);
        var bastion = agents.First(a => a.AgentKey == "backend");
        Assert.Equal(2, bastion.ActiveTaskCount);
        Assert.Equal(1, bastion.DoneTaskCount);
    }

    [Fact]
    public async Task Status_Active_WhenAgentHasInProgressTasks()
    {
        var pid = await SeedProject();
        _db.Tasks.Add(new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "T1", Column = "InProgress", AssigneeAgentKey = "frontend", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        var result = await _controller.GetSummary();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var agents = Assert.IsType<List<AgentSummaryDto>>(ok.Value);
        Assert.Equal("active", agents.First(a => a.AgentKey == "frontend").Status);
    }

    [Fact]
    public async Task Status_Idle_WhenAgentHasNoTasks()
    {
        var result = await _controller.GetSummary();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var agents = Assert.IsType<List<AgentSummaryDto>>(ok.Value);
        Assert.All(agents, a => Assert.Equal("idle", a.Status));
    }

    [Fact]
    public async Task CurrentFocus_ReturnsMostRecentInProgressUpdateText()
    {
        var pid = await SeedProject();
        _db.Tasks.AddRange(
            new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "Old", Column = "InProgress", AssigneeAgentKey = "ux", LastAgentUpdateAt = DateTime.UtcNow.AddHours(-2), LastAgentUpdateText = "Old focus", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "New", Column = "InProgress", AssigneeAgentKey = "ux", LastAgentUpdateAt = DateTime.UtcNow, LastAgentUpdateText = "Current focus", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _db.SaveChangesAsync();

        var result = await _controller.GetSummary();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var agents = Assert.IsType<List<AgentSummaryDto>>(ok.Value);
        Assert.Equal("Current focus", agents.First(a => a.AgentKey == "ux").CurrentFocus);
    }

    [Fact]
    public async Task LegacyAssignee_CountsTowardActiveTaskCount()
    {
        var pid = await SeedProject();
        _db.Tasks.Add(new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "Legacy", Column = "InProgress", AssigneeAgentKey = null, Assignee = "Pixel", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        var result = await _controller.GetSummary();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var agents = Assert.IsType<List<AgentSummaryDto>>(ok.Value);
        var pixel = agents.First(a => a.AgentKey == "frontend");
        Assert.Equal(1, pixel.ActiveTaskCount);
    }

    [Fact]
    public async Task LegacyAssignee_AgentStatusIsActive_NotIdle()
    {
        var pid = await SeedProject();
        _db.Tasks.Add(new TaskItem { Id = Guid.NewGuid(), ProjectId = pid, Title = "Legacy2", Column = "InProgress", AssigneeAgentKey = null, Assignee = "pixel", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _db.SaveChangesAsync();

        var result = await _controller.GetSummary();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var agents = Assert.IsType<List<AgentSummaryDto>>(ok.Value);
        Assert.Equal("active", agents.First(a => a.AgentKey == "frontend").Status);
    }
}
