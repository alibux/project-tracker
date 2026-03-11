using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Controllers;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Xunit;

namespace Tracker.Api.Tests;

public class AgentMetadataTests : IDisposable
{
    private readonly TrackerDbContext _db;
    private readonly TasksController _controller;
    private readonly ProjectsController _projects;

    public AgentMetadataTests()
    {
        var options = new DbContextOptionsBuilder<TrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TrackerDbContext(options);
        _controller = new TasksController(_db);
        _projects = new ProjectsController(_db);
    }

    public void Dispose() => _db.Dispose();

    private async Task<ProjectDto> SeedProject()
    {
        var result = await _projects.Create(new CreateProjectDto { Name = "Agent Test Project" });
        var created = Assert.IsType<CreatedAtActionResult>(result);
        return Assert.IsType<ProjectDto>(created.Value);
    }

    [Fact]
    public async Task Create_WithAgentMetadata_ReturnsFieldsInResponse()
    {
        var project = await SeedProject();
        var now = DateTime.UtcNow;

        var result = await _controller.Create(new CreateTaskDto
        {
            ProjectId = project.Id,
            Title = "Agent task",
            AssigneeAgentKey = "backend",
            AssigneeAgentName = "Bastion",
            AssigneeAgentEmoji = "🏰",
            ActivityStatus = "active",
            LastAgentUpdateAt = now,
            LastAgentUpdateText = "Implementing card badges"
        });

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto = Assert.IsType<TaskDto>(created.Value);

        Assert.Equal("backend", dto.AssigneeAgentKey);
        Assert.Equal("Bastion", dto.AssigneeAgentName);
        Assert.Equal("🏰", dto.AssigneeAgentEmoji);
        Assert.Equal("active", dto.ActivityStatus);
        Assert.Equal(now, dto.LastAgentUpdateAt);
        Assert.Equal("Implementing card badges", dto.LastAgentUpdateText);
    }

    [Fact]
    public async Task Update_AgentFields_ReturnsUpdatedValues()
    {
        var project = await SeedProject();

        var createResult = await _controller.Create(new CreateTaskDto
        {
            ProjectId = project.Id,
            Title = "Update test"
        });
        var created = Assert.IsType<CreatedAtActionResult>(createResult);
        var task = Assert.IsType<TaskDto>(created.Value);

        var now = DateTime.UtcNow;
        var updateResult = await _controller.Update(task.Id, new UpdateTaskDto
        {
            Title = "Update test",
            AssigneeAgentKey = "frontend",
            AssigneeAgentName = "Pixel",
            AssigneeAgentEmoji = "🎨",
            ActivityStatus = "reviewing",
            LastAgentUpdateAt = now,
            LastAgentUpdateText = "Reviewing PR"
        });

        var ok = Assert.IsType<OkObjectResult>(updateResult);
        var updated = Assert.IsType<TaskDto>(ok.Value);

        Assert.Equal("frontend", updated.AssigneeAgentKey);
        Assert.Equal("Pixel", updated.AssigneeAgentName);
        Assert.Equal("🎨", updated.AssigneeAgentEmoji);
        Assert.Equal("reviewing", updated.ActivityStatus);
        Assert.Equal(now, updated.LastAgentUpdateAt);
        Assert.Equal("Reviewing PR", updated.LastAgentUpdateText);
    }

    [Fact]
    public async Task Create_WithoutAgentFields_ReturnsNulls()
    {
        var project = await SeedProject();

        var result = await _controller.Create(new CreateTaskDto
        {
            ProjectId = project.Id,
            Title = "No agent fields"
        });

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto = Assert.IsType<TaskDto>(created.Value);

        Assert.Null(dto.AssigneeAgentKey);
        Assert.Null(dto.AssigneeAgentName);
        Assert.Null(dto.AssigneeAgentEmoji);
        Assert.Null(dto.ActivityStatus);
        Assert.Null(dto.LastAgentUpdateAt);
        Assert.Null(dto.LastAgentUpdateText);
    }
}
