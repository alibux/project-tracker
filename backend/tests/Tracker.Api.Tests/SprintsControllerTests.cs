using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Controllers;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Xunit;

namespace Tracker.Api.Tests;

/// <summary>
/// Unit tests for SprintsController using an in-memory database.
/// </summary>
public class SprintsControllerTests : IDisposable
{
    private readonly TrackerDbContext _db;
    private readonly SprintsController _controller;
    private readonly ProjectsController _projects;

    public SprintsControllerTests()
    {
        var options = new DbContextOptionsBuilder<TrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TrackerDbContext(options);
        _controller = new SprintsController(_db);
        _projects = new ProjectsController(_db);
    }

    public void Dispose() => _db.Dispose();

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private async Task<ProjectDto> SeedProject(string name = "Test Project")
    {
        var result = await _projects.Create(new CreateProjectDto { Name = name });
        var created = Assert.IsType<CreatedAtActionResult>(result);
        return Assert.IsType<ProjectDto>(created.Value);
    }

    private async Task<SprintDto> SeedSprint(Guid projectId, string name = "Sprint 1")
    {
        var result = await _controller.Create(projectId, new CreateSprintDto { Name = name });
        var created = Assert.IsType<CreatedAtActionResult>(result);
        return Assert.IsType<SprintDto>(created.Value);
    }

    // -------------------------------------------------------------------------
    // GET /api/projects/{projectId}/sprints
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetAll_ReturnsEmpty_WhenNoSprints()
    {
        var project = await SeedProject();
        var result = await _controller.GetAll(project.Id);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Empty(Assert.IsAssignableFrom<IEnumerable<SprintDto>>(ok.Value));
    }

    [Fact]
    public async Task GetAll_Returns404_WhenProjectNotFound()
    {
        var result = await _controller.GetAll(Guid.NewGuid());
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetAll_ReturnsSprints_ForProject()
    {
        var project = await SeedProject();
        await SeedSprint(project.Id, "Sprint 1");
        await SeedSprint(project.Id, "Sprint 2");

        var result = await _controller.GetAll(project.Id);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(2, Assert.IsAssignableFrom<IEnumerable<SprintDto>>(ok.Value).Count());
    }

    // -------------------------------------------------------------------------
    // POST /api/projects/{projectId}/sprints
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_ReturnsCreated_WithValidPayload()
    {
        var project = await SeedProject();
        var dto = new CreateSprintDto
        {
            Name = "Sprint 1",
            StartDate = new DateOnly(2026, 3, 1),
            EndDate = new DateOnly(2026, 3, 14)
        };

        var result = await _controller.Create(project.Id, dto);
        var created = Assert.IsType<CreatedAtActionResult>(result);
        var sprint = Assert.IsType<SprintDto>(created.Value);

        Assert.Equal("Sprint 1", sprint.Name);
        Assert.Equal(project.Id, sprint.ProjectId);
        Assert.False(sprint.IsActive);
        Assert.Equal(new DateOnly(2026, 3, 1), sprint.StartDate);
        Assert.Equal(new DateOnly(2026, 3, 14), sprint.EndDate);
    }

    [Fact]
    public async Task Create_Returns400_WhenNameEmpty()
    {
        var project = await SeedProject();
        var result = await _controller.Create(project.Id, new CreateSprintDto { Name = "" });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_Returns400_WhenEndDateBeforeStartDate()
    {
        var project = await SeedProject();
        var dto = new CreateSprintDto
        {
            Name = "Bad Dates",
            StartDate = new DateOnly(2026, 3, 14),
            EndDate = new DateOnly(2026, 3, 1)
        };
        var result = await _controller.Create(project.Id, dto);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_Returns404_WhenProjectNotFound()
    {
        var result = await _controller.Create(Guid.NewGuid(), new CreateSprintDto { Name = "Orphan Sprint" });
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------------------------------------------------------
    // PUT /api/sprints/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_ReturnsUpdatedSprint()
    {
        var project = await SeedProject();
        var sprint = await SeedSprint(project.Id, "Old Name");

        var dto = new UpdateSprintDto
        {
            Name = "New Name",
            StartDate = new DateOnly(2026, 4, 1),
            EndDate = new DateOnly(2026, 4, 14)
        };

        var result = await _controller.Update(sprint.Id, dto);
        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<SprintDto>(ok.Value);

        Assert.Equal("New Name", updated.Name);
        Assert.Equal(new DateOnly(2026, 4, 1), updated.StartDate);
    }

    [Fact]
    public async Task Update_Returns404_WhenNotFound()
    {
        var dto = new UpdateSprintDto { Name = "Doesn't matter" };
        var result = await _controller.Update(Guid.NewGuid(), dto);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/sprints/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Delete_Returns204_AndRemovesSprint()
    {
        var project = await SeedProject();
        var sprint = await SeedSprint(project.Id);

        var result = await _controller.Delete(sprint.Id);
        Assert.IsType<NoContentResult>(result);
        Assert.Null(await _db.Sprints.FindAsync(sprint.Id));
    }

    [Fact]
    public async Task Delete_UnassignsTasksFromSprint()
    {
        var project = await SeedProject();
        var sprint = await SeedSprint(project.Id);

        // Create a task assigned to the sprint
        var tasksController = new TasksController(_db);
        var taskResult = await tasksController.Create(new CreateTaskDto
        {
            ProjectId = project.Id,
            SprintId = sprint.Id,
            Title = "Task in sprint"
        });
        var taskDto = Assert.IsType<TaskDto>(Assert.IsType<CreatedAtActionResult>(taskResult).Value);

        // Delete the sprint
        await _controller.Delete(sprint.Id);

        // Task should now have SprintId = null
        var task = await _db.Tasks.FindAsync(taskDto.Id);
        Assert.NotNull(task);
        Assert.Null(task.SprintId);
    }

    [Fact]
    public async Task Delete_Returns404_WhenNotFound()
    {
        var result = await _controller.Delete(Guid.NewGuid());
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------------------------------------------------------
    // POST /api/sprints/{id}/activate
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Activate_SetsSprintAsActive()
    {
        var project = await SeedProject();
        var sprint = await SeedSprint(project.Id);

        var result = await _controller.Activate(sprint.Id);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.True(Assert.IsType<SprintDto>(ok.Value).IsActive);
    }

    [Fact]
    public async Task Activate_DeactivatesPreviouslyActiveSprint()
    {
        var project = await SeedProject();
        var sprint1 = await SeedSprint(project.Id, "Sprint 1");
        var sprint2 = await SeedSprint(project.Id, "Sprint 2");

        // Activate sprint1 first
        await _controller.Activate(sprint1.Id);

        // Now activate sprint2 — sprint1 should become inactive
        await _controller.Activate(sprint2.Id);

        var s1 = await _db.Sprints.FindAsync(sprint1.Id);
        var s2 = await _db.Sprints.FindAsync(sprint2.Id);

        Assert.NotNull(s1); Assert.False(s1.IsActive);
        Assert.NotNull(s2); Assert.True(s2.IsActive);
    }

    [Fact]
    public async Task Activate_OnlyAffectsSpritsInSameProject()
    {
        var project1 = await SeedProject("P1");
        var project2 = await SeedProject("P2");

        var s1 = await SeedSprint(project1.Id, "P1 Sprint");
        var s2 = await SeedSprint(project2.Id, "P2 Sprint");

        // Activate s1, then s2 — s1 should remain active (different project)
        await _controller.Activate(s1.Id);
        await _controller.Activate(s2.Id);

        var dbS1 = await _db.Sprints.FindAsync(s1.Id);
        Assert.NotNull(dbS1);
        Assert.True(dbS1.IsActive); // not touched by s2 activation
    }

    [Fact]
    public async Task Activate_Returns404_WhenNotFound()
    {
        var result = await _controller.Activate(Guid.NewGuid());
        Assert.IsType<NotFoundObjectResult>(result);
    }
}
