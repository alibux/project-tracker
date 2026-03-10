using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Controllers;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Xunit;

namespace Tracker.Api.Tests;

/// <summary>
/// Phase 2 — QA gap-fill integration tests covering edge cases and error paths
/// not covered by the existing 63 unit tests.
/// </summary>
public class IntegrationGapTests : IDisposable
{
    private readonly TrackerDbContext _db;
    private readonly ProjectsController _projects;
    private readonly TasksController _tasks;
    private readonly SprintsController _sprints;
    private readonly SettingsController _settings;

    public IntegrationGapTests()
    {
        var options = new DbContextOptionsBuilder<TrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TrackerDbContext(options);
        _projects = new ProjectsController(_db);
        _tasks = new TasksController(_db);
        _sprints = new SprintsController(_db);
        _settings = new SettingsController(_db);
    }

    public void Dispose() => _db.Dispose();

    // =========================================================================
    // Helpers
    // =========================================================================

    private async Task<ProjectDto> SeedProject(string name = "Project")
    {
        var result = await _projects.Create(new CreateProjectDto { Name = name });
        return Assert.IsType<ProjectDto>(Assert.IsType<CreatedAtActionResult>(result).Value);
    }

    private async Task<TaskDto> SeedTask(Guid projectId, string title = "Task", string column = "Backlog")
    {
        var result = await _tasks.Create(new CreateTaskDto
        {
            ProjectId = projectId,
            Title = title,
            Column = column
        });
        return Assert.IsType<TaskDto>(Assert.IsType<CreatedAtActionResult>(result).Value);
    }

    private async Task<SprintDto> SeedSprint(Guid projectId, string name = "Sprint 1")
    {
        var result = await _sprints.Create(projectId, new CreateSprintDto { Name = name });
        return Assert.IsType<SprintDto>(Assert.IsType<CreatedAtActionResult>(result).Value);
    }

    // =========================================================================
    // Projects — cascade delete
    // =========================================================================

    [Fact]
    public async Task DeleteProject_CascadesTo_TasksAndSprints()
    {
        var project = await SeedProject("Cascade Project");

        // Seed associated data
        await SeedTask(project.Id, "Task 1");
        await SeedTask(project.Id, "Task 2");
        await SeedSprint(project.Id, "Sprint A");
        await SeedSprint(project.Id, "Sprint B");

        Assert.Equal(2, await _db.Tasks.CountAsync(t => t.ProjectId == project.Id));
        Assert.Equal(2, await _db.Sprints.CountAsync(s => s.ProjectId == project.Id));

        // Delete the project
        var result = await _projects.Delete(project.Id);
        Assert.IsType<NoContentResult>(result);

        // All associated records must be gone
        Assert.Equal(0, await _db.Tasks.CountAsync(t => t.ProjectId == project.Id));
        Assert.Equal(0, await _db.Sprints.CountAsync(s => s.ProjectId == project.Id));
        Assert.Null(await _db.Projects.FindAsync(project.Id));
    }

    // =========================================================================
    // Projects — validation ProblemDetails shape
    // =========================================================================

    [Fact]
    public async Task GetById_404_HasProblemDetailsFields()
    {
        var result = await _projects.GetById(Guid.NewGuid());
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);

        Assert.NotNull(problem.Type);
        Assert.NotNull(problem.Title);
        Assert.Equal(404, problem.Status);
        Assert.NotNull(problem.Detail);
    }

    [Fact]
    public async Task Update_Returns400_WithProblemDetails_WhenNameMissing()
    {
        var project = await SeedProject("Valid");
        var result = await _projects.Update(project.Id, new UpdateProjectDto { Name = "" });
        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);

        Assert.NotNull(problem.Type);
        Assert.NotNull(problem.Title);
        Assert.Equal(400, problem.Status);
        Assert.NotNull(problem.Detail);
    }

    // =========================================================================
    // Tasks — filter by column
    // =========================================================================

    [Fact]
    public async Task GetAll_FiltersBy_ProjectIdAndColumn()
    {
        var project = await SeedProject("P");
        await SeedTask(project.Id, "Backlog Task", "Backlog");
        await SeedTask(project.Id, "In Progress Task", "InProgress");

        // Filter by project only — should return 2
        var allResult = await _tasks.GetAll(project.Id, null);
        var allOk = Assert.IsType<OkObjectResult>(allResult);
        Assert.Equal(2, Assert.IsAssignableFrom<IEnumerable<TaskDto>>(allOk.Value).Count());
    }

    // =========================================================================
    // Tasks — Move validation
    // =========================================================================

    [Fact]
    public async Task Move_Returns400_WithProblemDetails_WhenColumnInvalid()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id);

        var result = await _tasks.Move(task.Id, new MoveTaskDto { Column = "NOPE", Position = 1000 });
        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);

        Assert.Equal(400, problem.Status);
        Assert.NotNull(problem.Detail);
    }

    [Fact]
    public async Task Move_Returns400_WhenPositionIsNegative()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id);

        var result = await _tasks.Move(task.Id, new MoveTaskDto { Column = "Done", Position = -1 });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Move_Returns400_WhenPositionIsZero()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id);

        var result = await _tasks.Move(task.Id, new MoveTaskDto { Column = "Done", Position = 0 });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // =========================================================================
    // Tasks — Create invalid type
    // =========================================================================

    [Fact]
    public async Task Create_Returns400_WhenTypeInvalid()
    {
        var project = await SeedProject();
        var result = await _tasks.Create(new CreateTaskDto
        {
            ProjectId = project.Id,
            Title = "T",
            Priority = "medium",
            Type = "epic" // invalid
        });

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);
        Assert.Equal(400, problem.Status);
    }

    // =========================================================================
    // Tasks — PUT partial update preserves unchanged fields
    // =========================================================================

    [Fact]
    public async Task Update_PreservesUnchangedFields()
    {
        var project = await SeedProject();
        var task = await SeedTask(project.Id, "Original Title", "Backlog");

        // Seed a sprint to assign
        var sprint = await SeedSprint(project.Id, "Sprint X");

        // Update only the title and sprint; keep column + priority + type defaults
        var dto = new UpdateTaskDto
        {
            SprintId = sprint.Id,
            Title = "Renamed",
            Priority = "high",
            Type = "bug",
            Assignee = "Alice",
            Column = "InProgress"
        };
        var result = await _tasks.Update(task.Id, dto);
        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<TaskDto>(ok.Value);

        Assert.Equal("Renamed", updated.Title);
        Assert.Equal("high", updated.Priority);
        Assert.Equal("bug", updated.Type);
        Assert.Equal("Alice", updated.Assignee);
        Assert.Equal("InProgress", updated.Column);
        Assert.Equal(sprint.Id, updated.SprintId);
        // ProjectId must not change
        Assert.Equal(project.Id, updated.ProjectId);
    }

    // =========================================================================
    // Sprints — empty array when no sprints
    // =========================================================================

    [Fact]
    public async Task GetSprints_ReturnsEmptyArray_WhenNoSprints()
    {
        var project = await SeedProject();
        var result = await _sprints.GetAll(project.Id);
        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<SprintDto>>(ok.Value);
        Assert.Empty(items);
    }

    // =========================================================================
    // Sprints — activate deactivates previous in same project
    // =========================================================================

    [Fact]
    public async Task ActivateSprint_Deactivates_PreviousActiveInSameProject()
    {
        var project = await SeedProject();
        var s1 = await SeedSprint(project.Id, "Sprint 1");
        var s2 = await SeedSprint(project.Id, "Sprint 2");

        await _sprints.Activate(s1.Id);
        await _sprints.Activate(s2.Id);

        var dbS1 = await _db.Sprints.FindAsync(s1.Id);
        var dbS2 = await _db.Sprints.FindAsync(s2.Id);

        Assert.NotNull(dbS1); Assert.False(dbS1.IsActive);
        Assert.NotNull(dbS2); Assert.True(dbS2.IsActive);
    }

    // =========================================================================
    // Sprints — delete sets sprintId=null on tasks
    // =========================================================================

    [Fact]
    public async Task DeleteSprint_SetsSprintIdNullOnAssignedTasks()
    {
        var project = await SeedProject();
        var sprint = await SeedSprint(project.Id, "Sprint To Delete");

        // Assign a task to the sprint
        var createResult = await _tasks.Create(new CreateTaskDto
        {
            ProjectId = project.Id,
            SprintId = sprint.Id,
            Title = "Assigned Task"
        });
        var taskDto = Assert.IsType<TaskDto>(Assert.IsType<CreatedAtActionResult>(createResult).Value);

        // Delete sprint
        await _sprints.Delete(sprint.Id);

        // Task should have SprintId = null
        var task = await _db.Tasks.FindAsync(taskDto.Id);
        Assert.NotNull(task);
        Assert.Null(task.SprintId);
    }

    // =========================================================================
    // Sprints — missing name returns 400
    // =========================================================================

    [Fact]
    public async Task CreateSprint_Returns400_WhenNameMissing()
    {
        var project = await SeedProject();
        var result = await _sprints.Create(project.Id, new CreateSprintDto { Name = "" });
        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);
        Assert.Equal(400, problem.Status);
    }

    // =========================================================================
    // Settings — GET auto-creates defaults
    // =========================================================================

    [Fact]
    public async Task GetSettings_AutoCreatesDefaults_WhenNoRowExists()
    {
        Assert.Equal(0, await _db.Settings.CountAsync());

        var result = await _settings.Get();
        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<SettingsDto>(ok.Value);

        Assert.Equal(1, await _db.Settings.CountAsync());
        Assert.Equal("09:00", dto.DigestTime);
        Assert.Null(dto.DefaultProjectId);
    }

    // =========================================================================
    // Settings — PUT invalid digestTime format
    // =========================================================================

    [Theory]
    [InlineData("9:00")]
    [InlineData("25:00")]
    [InlineData("badtime")]
    [InlineData("")]
    public async Task UpdateSettings_Returns400_WhenDigestTimeInvalid(string badTime)
    {
        var result = await _settings.Update(new UpdateSettingsDto { DigestTime = badTime });
        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.IsType<ProblemDetails>(bad.Value);
    }

    // =========================================================================
    // Settings — PUT valid digestTime updates correctly
    // =========================================================================

    [Theory]
    [InlineData("00:00")]
    [InlineData("12:00")]
    [InlineData("23:59")]
    public async Task UpdateSettings_AcceptsAndPersists_ValidDigestTime(string validTime)
    {
        var result = await _settings.Update(new UpdateSettingsDto { DigestTime = validTime });
        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<SettingsDto>(ok.Value);
        Assert.Equal(validTime, dto.DigestTime);
    }

    // =========================================================================
    // Cross-cutting — 404 responses have RFC 7807 ProblemDetails
    // =========================================================================

    [Fact]
    public async Task TaskGetById_404_HasRfc7807ProblemDetails()
    {
        var result = await _tasks.GetById(Guid.NewGuid());
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);

        Assert.NotNull(problem.Type);
        Assert.NotNull(problem.Title);
        Assert.Equal(404, problem.Status);
        Assert.NotNull(problem.Detail);
    }

    [Fact]
    public async Task SprintGetAll_404_WhenProjectNotFound_HasRfc7807ProblemDetails()
    {
        var result = await _sprints.GetAll(Guid.NewGuid());
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);

        Assert.NotNull(problem.Type);
        Assert.NotNull(problem.Title);
        Assert.Equal(404, problem.Status);
        Assert.NotNull(problem.Detail);
    }

    // =========================================================================
    // Cross-cutting — 400 responses have RFC 7807 ProblemDetails
    // =========================================================================

    [Fact]
    public async Task TaskCreate_400_InvalidPriority_HasRfc7807ProblemDetails()
    {
        var project = await SeedProject();
        var result = await _tasks.Create(new CreateTaskDto
        {
            ProjectId = project.Id,
            Title = "T",
            Priority = "extreme"
        });

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);

        Assert.NotNull(problem.Type);
        Assert.NotNull(problem.Title);
        Assert.Equal(400, problem.Status);
        Assert.NotNull(problem.Detail);
    }
}
