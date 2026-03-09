using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Controllers;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Xunit;

namespace Tracker.Api.Tests;

/// <summary>
/// Unit tests for TasksController using an in-memory database.
/// </summary>
public class TasksControllerTests : IDisposable
{
    private readonly TrackerDbContext _db;
    private readonly TasksController _controller;
    private readonly ProjectsController _projects;

    public TasksControllerTests()
    {
        var options = new DbContextOptionsBuilder<TrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TrackerDbContext(options);
        _controller = new TasksController(_db);
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

    private async Task<TaskDto> SeedTask(Guid projectId, string title = "Test Task", string column = "Backlog")
    {
        var result = await _controller.Create(new CreateTaskDto
        {
            ProjectId = projectId,
            Title = title,
            Column = column
        });
        var created = Assert.IsType<CreatedAtActionResult>(result);
        return Assert.IsType<TaskDto>(created.Value);
    }

    // -------------------------------------------------------------------------
    // GET /api/tasks
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetAll_ReturnsEmpty_WhenNoTasks()
    {
        var result = await _controller.GetAll(null, null);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Empty(Assert.IsAssignableFrom<IEnumerable<TaskDto>>(ok.Value));
    }

    [Fact]
    public async Task GetAll_FiltersBy_ProjectId()
    {
        var p1 = await SeedProject("P1");
        var p2 = await SeedProject("P2");
        await SeedTask(p1.Id, "Task A");
        await SeedTask(p2.Id, "Task B");

        var result = await _controller.GetAll(p1.Id, null);
        var ok = Assert.IsType<OkObjectResult>(result);
        var tasks = Assert.IsAssignableFrom<IEnumerable<TaskDto>>(ok.Value).ToList();
        Assert.Single(tasks);
        Assert.Equal("Task A", tasks[0].Title);
    }

    // -------------------------------------------------------------------------
    // GET /api/tasks/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetById_Returns404_WhenNotFound()
    {
        var result = await _controller.GetById(Guid.NewGuid());
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, Assert.IsType<ProblemDetails>(notFound.Value).Status);
    }

    [Fact]
    public async Task GetById_ReturnsTask_WhenExists()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id, "Find Me");

        var result = await _controller.GetById(task.Id);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Find Me", Assert.IsType<TaskDto>(ok.Value).Title);
    }

    // -------------------------------------------------------------------------
    // POST /api/tasks
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_ReturnsCreated_WithValidPayload()
    {
        var project = await SeedProject();
        var dto = new CreateTaskDto { ProjectId = project.Id, Title = "New Task", Priority = "high", Type = "bug", Column = "InProgress" };

        var result = await _controller.Create(dto);
        var created = Assert.IsType<CreatedAtActionResult>(result);
        var task = Assert.IsType<TaskDto>(created.Value);

        Assert.Equal("New Task", task.Title);
        Assert.Equal("high", task.Priority);
        Assert.Equal("bug", task.Type);
        Assert.Equal("InProgress", task.Column);
        Assert.Equal(1000, task.Position); // first in column
    }

    [Fact]
    public async Task Create_AssignsIncrementalPosition()
    {
        var project = await SeedProject();
        var t1 = await SeedTask(project.Id, "First", "Backlog");
        var t2 = await SeedTask(project.Id, "Second", "Backlog");

        Assert.Equal(1000, t1.Position);
        Assert.Equal(2000, t2.Position);
    }

    [Fact]
    public async Task Create_Returns400_WhenTitleEmpty()
    {
        var project = await SeedProject();
        var result = await _controller.Create(new CreateTaskDto { ProjectId = project.Id, Title = "" });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_Returns400_WhenPriorityInvalid()
    {
        var project = await SeedProject();
        var result = await _controller.Create(new CreateTaskDto { ProjectId = project.Id, Title = "T", Priority = "extreme" });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Create_Returns404_WhenProjectNotFound()
    {
        var result = await _controller.Create(new CreateTaskDto { ProjectId = Guid.NewGuid(), Title = "Orphan" });
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------------------------------------------------------
    // PUT /api/tasks/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_ReturnsUpdatedTask()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id, "Original");

        var dto = new UpdateTaskDto { Title = "Updated", Priority = "urgent", Type = "chore", Column = "Done" };
        var result = await _controller.Update(task.Id, dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<TaskDto>(ok.Value);
        Assert.Equal("Updated", updated.Title);
        Assert.Equal("urgent", updated.Priority);
        Assert.Equal("Done", updated.Column);
    }

    [Fact]
    public async Task Update_Returns404_WhenNotFound()
    {
        var dto = new UpdateTaskDto { Title = "X", Priority = "low", Type = "feature", Column = "Backlog" };
        var result = await _controller.Update(Guid.NewGuid(), dto);
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/tasks/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Delete_Returns204_AndRemovesTask()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id, "Delete Me");

        var result = await _controller.Delete(task.Id);
        Assert.IsType<NoContentResult>(result);
        Assert.Null(await _db.Tasks.FindAsync(task.Id));
    }

    [Fact]
    public async Task Delete_Returns404_WhenNotFound()
    {
        var result = await _controller.Delete(Guid.NewGuid());
        Assert.IsType<NotFoundObjectResult>(result);
    }

    // -------------------------------------------------------------------------
    // PATCH /api/tasks/{id}/move
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Move_UpdatesColumnAndPosition()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id, "Moveable", "Backlog");

        var result = await _controller.Move(task.Id, new MoveTaskDto { Column = "InProgress", Position = 1000 });
        var ok = Assert.IsType<OkObjectResult>(result);
        var moved = Assert.IsType<TaskDto>(ok.Value);

        Assert.Equal("InProgress", moved.Column);
        Assert.Equal(1000, moved.Position);
    }

    [Fact]
    public async Task Move_RebalancesPositions_OnCollision()
    {
        var project = await SeedProject();
        // Place an existing task at position 1000 in InProgress
        await _controller.Create(new CreateTaskDto { ProjectId = project.Id, Title = "Existing", Column = "InProgress" });
        var existing = (await _db.Tasks.FirstAsync(t => t.Title == "Existing"));

        // Create second task in Backlog, then try to move it to InProgress at position 1000
        var task2 = await SeedTask(project.Id, "Newcomer", "Backlog");
        await _controller.Move(task2.Id, new MoveTaskDto { Column = "InProgress", Position = 1000 });

        // Existing task should have been shifted to 2000
        await _db.Entry(existing).ReloadAsync();
        Assert.Equal(2000, existing.Position);
    }

    [Fact]
    public async Task Move_Returns400_WhenColumnInvalid()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id, "T");
        var result = await _controller.Move(task.Id, new MoveTaskDto { Column = "InvalidCol", Position = 1000 });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Move_Returns404_WhenTaskNotFound()
    {
        var result = await _controller.Move(Guid.NewGuid(), new MoveTaskDto { Column = "Done", Position = 1000 });
        Assert.IsType<NotFoundObjectResult>(result);
    }
}
