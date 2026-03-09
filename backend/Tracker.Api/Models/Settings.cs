namespace Tracker.Api.Models;

/// <summary>
/// Singleton application settings row (one row in database).
/// </summary>
public class Settings
{
    /// <summary>Gets or sets the unique identifier.</summary>
    public Guid Id { get; set; }

    /// <summary>Gets or sets the default project to display on load.</summary>
    public Guid? DefaultProjectId { get; set; }

    /// <summary>Gets or sets the Telegram chat ID for digest notifications.</summary>
    public string? TelegramChatId { get; set; }

    /// <summary>Gets or sets the daily digest time in HH:mm format. Defaults to 09:00.</summary>
    public string DigestTime { get; set; } = "09:00";

    /// <summary>Gets or sets the GitHub webhook secret for verifying payloads.</summary>
    public string? GithubWebhookSecret { get; set; }
}
