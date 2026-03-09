using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tracker.Api.Controllers;
using Tracker.Api.Data;
using Tracker.Api.DTOs;
using Xunit;

namespace Tracker.Api.Tests;

/// <summary>
/// Unit tests for SettingsController using an in-memory database.
/// </summary>
public class SettingsControllerTests : IDisposable
{
    private readonly TrackerDbContext _db;
    private readonly SettingsController _controller;
    private readonly ProjectsController _projects;

    public SettingsControllerTests()
    {
        var options = new DbContextOptionsBuilder<TrackerDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TrackerDbContext(options);
        _controller = new SettingsController(_db);
        _projects = new ProjectsController(_db);
    }

    public void Dispose() => _db.Dispose();

    // -------------------------------------------------------------------------
    // GET /api/settings
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Get_ReturnsDefaults_WhenNoRowExists()
    {
        var result = await _controller.Get();
        var ok = Assert.IsType<OkObjectResult>(result);
        var settings = Assert.IsType<SettingsDto>(ok.Value);

        Assert.NotEqual(Guid.Empty, settings.Id);
        Assert.Equal("09:00", settings.DigestTime);
        Assert.Null(settings.DefaultProjectId);
        Assert.Null(settings.TelegramChatId);
        Assert.Null(settings.GithubWebhookSecret);
    }

    [Fact]
    public async Task Get_DoesNotCreateDuplicates_OnMultipleCalls()
    {
        await _controller.Get();
        await _controller.Get();

        var count = await _db.Settings.CountAsync();
        Assert.Equal(1, count);
    }

    // -------------------------------------------------------------------------
    // PUT /api/settings
    // -------------------------------------------------------------------------

    [Fact]
    public async Task Update_ReturnsUpdatedSettings_WithValidPayload()
    {
        var project = await SeedProject();
        var dto = new UpdateSettingsDto
        {
            DefaultProjectId = project.Id,
            TelegramChatId = "123456789",
            DigestTime = "08:30",
            GithubWebhookSecret = "secret123"
        };

        var result = await _controller.Update(dto);
        var ok = Assert.IsType<OkObjectResult>(result);
        var settings = Assert.IsType<SettingsDto>(ok.Value);

        Assert.Equal(project.Id, settings.DefaultProjectId);
        Assert.Equal("123456789", settings.TelegramChatId);
        Assert.Equal("08:30", settings.DigestTime);
        Assert.Equal("secret123", settings.GithubWebhookSecret);
    }

    [Fact]
    public async Task Update_ClearsFields_WhenNullProvided()
    {
        var project = await SeedProject();

        // Set values first
        await _controller.Update(new UpdateSettingsDto
        {
            DefaultProjectId = project.Id,
            TelegramChatId = "abc",
            DigestTime = "09:00"
        });

        // Clear them
        var result = await _controller.Update(new UpdateSettingsDto
        {
            DefaultProjectId = null,
            TelegramChatId = null,
            DigestTime = "09:00"
        });

        var ok = Assert.IsType<OkObjectResult>(result);
        var settings = Assert.IsType<SettingsDto>(ok.Value);
        Assert.Null(settings.DefaultProjectId);
        Assert.Null(settings.TelegramChatId);
    }

    [Theory]
    [InlineData("9:00")]    // missing leading zero
    [InlineData("09:0")]    // incomplete minutes
    [InlineData("25:00")]   // invalid hour
    [InlineData("09:60")]   // invalid minutes
    [InlineData("noon")]    // nonsense
    [InlineData("")]        // empty
    public async Task Update_Returns400_WhenDigestTimeInvalid(string badTime)
    {
        var result = await _controller.Update(new UpdateSettingsDto { DigestTime = badTime });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Theory]
    [InlineData("00:00")]
    [InlineData("09:00")]
    [InlineData("18:30")]
    [InlineData("23:59")]
    public async Task Update_AcceptsValidDigestTimes(string validTime)
    {
        var result = await _controller.Update(new UpdateSettingsDto { DigestTime = validTime });
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Update_Returns404_WhenDefaultProjectIdNotFound()
    {
        var result = await _controller.Update(new UpdateSettingsDto
        {
            DefaultProjectId = Guid.NewGuid(),
            DigestTime = "09:00"
        });
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Update_CreatesSettingsRow_IfNotExists()
    {
        Assert.Equal(0, await _db.Settings.CountAsync());

        await _controller.Update(new UpdateSettingsDto { DigestTime = "10:00" });

        Assert.Equal(1, await _db.Settings.CountAsync());
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private async Task<ProjectDto> SeedProject(string name = "Test Project")
    {
        var result = await _projects.Create(new CreateProjectDto { Name = name });
        var created = Assert.IsType<CreatedAtActionResult>(result);
        return Assert.IsType<ProjectDto>(created.Value);
    }
}
