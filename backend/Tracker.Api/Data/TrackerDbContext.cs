using Microsoft.EntityFrameworkCore;
using Tracker.Api.Models;

namespace Tracker.Api.Data;

/// <summary>
/// Entity Framework Core DbContext for the Project Tracker application.
/// </summary>
public class TrackerDbContext : DbContext
{
    /// <inheritdoc />
    public TrackerDbContext(DbContextOptions<TrackerDbContext> options) : base(options) { }

    /// <summary>Projects table.</summary>
    public DbSet<Project> Projects => Set<Project>();

    /// <summary>Sprints table.</summary>
    public DbSet<Sprint> Sprints => Set<Sprint>();

    /// <summary>Task items table.</summary>
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    /// <summary>Application settings table (singleton).</summary>
    public DbSet<Settings> Settings => Set<Settings>();

    /// <inheritdoc />
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Project
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
        });

        // Sprint
        modelBuilder.Entity<Sprint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.IsActive).HasDefaultValue(false);

            entity.HasOne(e => e.Project)
                  .WithMany(p => p.Sprints)
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // TaskItem
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("medium");
            entity.Property(e => e.Type).HasMaxLength(20).HasDefaultValue("feature");
            entity.Property(e => e.Column).HasMaxLength(20).HasDefaultValue("Backlog");

            entity.HasOne(e => e.Project)
                  .WithMany(p => p.Tasks)
                  .HasForeignKey(e => e.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sprint)
                  .WithMany(s => s.Tasks)
                  .HasForeignKey(e => e.SprintId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);
        });

        // Settings (singleton)
        modelBuilder.Entity<Settings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.DigestTime).HasDefaultValue("09:00");
        });
    }

    /// <inheritdoc />
    public override int SaveChanges()
    {
        SetTimestamps();
        return base.SaveChanges();
    }

    /// <inheritdoc />
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetTimestamps()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "CreatedAt"))
                    entry.Property("CreatedAt").CurrentValue = now;
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
        }
    }
}
