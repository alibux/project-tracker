using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Controllers;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Xunit;

namespace Tracker.Api.Tests;

/// <summary>
/// Unit tests for ProjectsController using an in-memory database.
/// </summary>
public class ProjectsControllerTests : IDisposable
{
    private readonly TrackerDbContext _db;
    private readonly ProjectsController _controller;

    public ProjectsControllerTests()
    {
        var options = new DbContextOptionsBuilder<TrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TrackerDbContext(options);
        _controller = new ProjectsController(_db);
    }

    public void Dispose() => _db.Dispose();

    // -------------------------------------------------------------------------
    // GET /api/projects
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetAll_ReturnsEmptyList_WhenNoProjects()
    {
        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<ProjectDto>>(ok.Value);
        Assert.Empty(items);
    }

    [Fact]
    public async Task GetAll_ReturnsAllProjects()
    {
        await _controller.Create(new CreateProjectDto { Name = "Alpha" });
        await _controller.Create(new CreateProjectDto { Name = "Beta" });

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<ProjectDto>>(ok.Value);
        Assert.Equal(2, items.Count());
    }

    // -------------------------------------------------------------------------
    // GET /api/projects/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task GetById_ReturnsProject_WhenExists()
    {
        var created = await CreateProject("Test Project");

        var result = await _controller.GetById(created.Id);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<ProjectDto>(ok.Value);
        Assert.Equal("Test Project", dto.Name);
        Assert.Equal(created.Id, dto.Id);
    }

    [Fact]
    public async Task GetById_Returns404_WhenNotFound()
    {
        var result = await _controller.GetById(Guid.NewGuid());

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal(404, problem.Status);
    }

    // -------------------------------------------------------------------------
    // POST /api/projects
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Create_ReturnsCreated_WithValidPayload()
    {
        var dto = new CreateProjectDto { Name = "My Project", Description = "A description" };

        var result = await _controller.Create(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var project = Assert.IsType<ProjectDto>(created.Value);
        Assert.Equal("My Project", project.Name);
        Assert.Equal("A description", project.Description);
        Assert.NotEqual(Guid.Empty, project.Id);
    }

    [Fact]
    public async Task Create_Returns400_WhenNameIsEmpty()
    {
        var dto = new CreateProjectDto { Name = "" };

        var result = await _controller.Create(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);
        Assert.Equal(400, problem.Status);
    }

    [Fact]
    public async Task Create_Returns400_WhenNameExceeds255Chars()
    {
        var dto = new CreateProjectDto { Name = new string('x', 256) };

        var result = await _controller.Create(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);
        Assert.Equal(400, problem.Status);
    }

    // -------------------------------------------------------------------------
    // PUT /api/projects/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_ReturnsUpdatedProject_WhenValid()
    {
        var created = await CreateProject("Original Name");

        var dto = new UpdateProjectDto { Name = "Updated Name", Description = "New desc" };
        var result = await _controller.Update(created.Id, dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<ProjectDto>(ok.Value);
        Assert.Equal("Updated Name", updated.Name);
        Assert.Equal("New desc", updated.Description);
    }

    [Fact]
    public async Task Update_Returns404_WhenProjectNotFound()
    {
        var dto = new UpdateProjectDto { Name = "Doesn't Matter" };
        var result = await _controller.Update(Guid.NewGuid(), dto);

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal(404, problem.Status);
    }

    [Fact]
    public async Task Update_Returns400_WhenNameIsEmpty()
    {
        var created = await CreateProject("Valid Project");

        var dto = new UpdateProjectDto { Name = "   " };
        var result = await _controller.Update(created.Id, dto);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(bad.Value);
        Assert.Equal(400, problem.Status);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/projects/{id}
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Delete_Returns204_WhenProjectExists()
    {
        var created = await CreateProject("To Be Deleted");

        var result = await _controller.Delete(created.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Null(await _db.Projects.FindAsync(created.Id));
    }

    [Fact]
    public async Task Delete_Returns404_WhenProjectNotFound()
    {
        var result = await _controller.Delete(Guid.NewGuid());

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);
        Assert.Equal(404, problem.Status);
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private async Task<ProjectDto> CreateProject(string name)
    {
        var result = await _controller.Create(new CreateProjectDto { Name = name });
        var created = Assert.IsType<CreatedAtActionResult>(result);
        return Assert.IsType<ProjectDto>(created.Value);
    }
}
