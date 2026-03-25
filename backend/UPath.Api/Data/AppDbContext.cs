using Microsoft.EntityFrameworkCore;
using UPath.Api.Models;

namespace UPath.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserGoal> UserGoals => Set<UserGoal>();
    public DbSet<Sponsor> Sponsors => Set<Sponsor>();
    public DbSet<Mentor> Mentors => Set<Mentor>();
    public DbSet<Meeting> Meetings => Set<Meeting>();
    public DbSet<StudentPreference> StudentPreferences => Set<StudentPreference>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<ResourceBookmark> ResourceBookmarks => Set<ResourceBookmark>();
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<Career> Careers => Set<Career>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── Goals ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Goal>()
            .HasKey(g => g.GoalId);

        // ── Users ────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>()
            .HasKey(u => u.Id);

        // ── UserGoals (composite PK: goalid + user_id) ────────────────────────
        modelBuilder.Entity<UserGoal>()
            .HasKey(ug => new { ug.GoalId, ug.UserId });

        modelBuilder.Entity<UserGoal>()
            .HasOne(ug => ug.User)
            .WithMany(u => u.UserGoals)
            .HasForeignKey(ug => ug.UserId)
            .HasPrincipalKey(u => u.Id)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserGoal>()
            .HasOne(ug => ug.Goal)
            .WithMany(g => g.UserGoals)
            .HasForeignKey(ug => ug.GoalId)
            .HasPrincipalKey(g => g.GoalId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Sponsor ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Sponsor>()
            .HasKey(s => s.SponsorId);

        // ── Mentors ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Mentor>()
            .HasKey(m => m.MentorId);

        // ── Meetings (composite PK: mentor_id + mentee_id) ───────────────────
        modelBuilder.Entity<Meeting>()
            .HasKey(m => new { m.MentorId, m.MenteeId });

        modelBuilder.Entity<Meeting>()
            .HasOne(m => m.Mentor)
            .WithMany(me => me.Meetings)
            .HasForeignKey(m => m.MentorId)
            .HasPrincipalKey(me => me.MentorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Meeting>()
            .HasOne(m => m.Mentee)
            .WithMany(u => u.MenteeMeetings)
            .HasForeignKey(m => m.MenteeId)
            .HasPrincipalKey(u => u.Id)
            .OnDelete(DeleteBehavior.Cascade);

        // ── StudentPreferences (PK = user_id, 1-to-1 with User) ─────────────
        modelBuilder.Entity<StudentPreference>()
            .HasKey(sp => sp.UserId);

        modelBuilder.Entity<StudentPreference>()
            .HasOne(sp => sp.User)
            .WithOne(u => u.StudentPreference)
            .HasForeignKey<StudentPreference>(sp => sp.UserId)
            .HasPrincipalKey<User>(u => u.Id)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Resources ────────────────────────────────────────────────────────
        modelBuilder.Entity<Resource>()
            .HasKey(r => r.ResourceId);

        // ── ResourceBookmarks (composite PK: user_id + resource_id) ──────────
        modelBuilder.Entity<ResourceBookmark>()
            .HasKey(rb => new { rb.UserId, rb.ResourceId });

        modelBuilder.Entity<ResourceBookmark>()
            .HasOne(rb => rb.User)
            .WithMany(u => u.ResourceBookmarks)
            .HasForeignKey(rb => rb.UserId)
            .HasPrincipalKey(u => u.Id)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ResourceBookmark>()
            .HasOne(rb => rb.Resource)
            .WithMany(r => r.ResourceBookmarks)
            .HasForeignKey(rb => rb.ResourceId)
            .HasPrincipalKey(r => r.ResourceId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Milestones (self-referencing hierarchy) ───────────────────────────
        modelBuilder.Entity<Milestone>()
            .HasKey(m => m.Id);

        modelBuilder.Entity<Milestone>()
            .HasOne(m => m.User)
            .WithMany(u => u.Milestones)
            .HasForeignKey(m => m.UserId)
            .HasPrincipalKey(u => u.Id)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Milestone>()
            .HasOne(m => m.Parent)
            .WithMany(m => m.Children)
            .HasForeignKey(m => m.ParentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── Careers ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Career>()
            .HasKey(c => c.CareerId);
    }
}
