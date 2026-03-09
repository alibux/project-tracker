namespace Tracker.Api.DTOs;

/// <summary>Response DTO for the Settings singleton.</summary>
public class SettingsDto
{
    public Guid Id { get; set; }
    public Guid? DefaultProjectId { get; set; }
    public string? TelegramChatId { get; set; }
    public string DigestTime { get; set; } = "09:00";
    public string? GithubWebhookSecret { get; set; }
}

/// <summary>Request DTO for updating Settings.</summary>
public class UpdateSettingsDto
{
    /// <summary>Optional default project shown on load.</summary>
    public Guid? DefaultProjectId { get; set; }

    /// <summary>Optional Telegram chat ID for daily digest.</summary>
    public string? TelegramChatId { get; set; }

    /// <summary>Daily digest time in HH:mm format (24h). Defaults to 09:00.</summary>
    public string DigestTime { get; set; } = "09:00";

    /// <summary>Optional GitHub webhook secret for payload verification.</summary>
    public string? GithubWebhookSecret { get; set; }
}
