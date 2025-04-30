using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ChronosSuite.Models;

public partial class PgDbContext : DbContext
{
    public PgDbContext()
    {
    }
    private readonly IConfiguration _configuration;
    private NpgsqlConnection DbConnection { get; }

    public PgDbContext(DbContextOptions<PgDbContext> options, IConfiguration configuration)
            : base(options)
    {
        _configuration = configuration;
        DbConnection = new NpgsqlConnection(_configuration.GetConnectionString("PgDB"));
    }

    public virtual DbSet<Company> Companies { get; set; }

    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<VisitRecord> VisitRecords { get; set; }

    public virtual DbSet<Visitor> Visitors { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseNpgsql(DbConnection.ToString());
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Company>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("companies_pkey");

            entity.ToTable("companies", "visitors");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("employees_pkey");

            entity.ToTable("employees", "company");

            entity.HasIndex(e => e.Email, "employees_email_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CompanyId).HasColumnName("company_id");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.FirstName)
                .HasMaxLength(100)
                .HasColumnName("first_name");
            entity.Property(e => e.LastName)
                .HasMaxLength(100)
                .HasColumnName("last_name");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .HasColumnName("phone_number");
            entity.Property(e => e.Position)
                .HasMaxLength(100)
                .HasColumnName("position");
                
            entity.HasOne(d => d.Company).WithMany()
                .HasForeignKey(d => d.CompanyId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("employees_company_id_fkey");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("locations_pkey");

            entity.ToTable("locations", "company");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.Description)
                .HasColumnName("description");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("users_pkey");

            entity.ToTable("users", "security");

            entity.HasIndex(e => e.Username, "users_username_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Pswd)
                .HasMaxLength(255)
                .HasColumnName("pswd");
            entity.Property(e => e.Salt)
                .HasMaxLength(255)
                .HasColumnName("salt");
            entity.Property(e => e.Secret)
                .HasMaxLength(255)
                .HasColumnName("secret");
            entity.Property(e => e.TwoFactorEnabled)
                .HasDefaultValue(false)
                .HasColumnName("two_factor_enabled");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("username");
        });

        modelBuilder.Entity<VisitRecord>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("visit_records_pkey");

            entity.ToTable("visit_records", "visitors");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AuthorizedEmployeeId).HasColumnName("authorized_employee_id");
            entity.Property(e => e.CarriedObjects).HasColumnName("carried_objects");
            entity.Property(e => e.LocationId).HasColumnName("location_id");
            entity.Property(e => e.Photo).HasColumnName("photo");
            entity.Property(e => e.Timestamp)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone")
                .HasColumnName("timestamp");
            entity.Property(e => e.EntryTime)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("entry_time");
            entity.Property(e => e.ExitTime)
                .HasColumnType("timestamp without time zone")
                .HasColumnName("exit_time");
            entity.Property(e => e.HasExited)
                .HasDefaultValue(false)
                .HasColumnName("has_exited");
            entity.Property(e => e.ReportFlag)
                .HasDefaultValue(false)
                .HasColumnName("report_flag");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.VisitorId).HasColumnName("visitor_id");

            entity.HasOne(d => d.AuthorizedEmployee).WithMany(p => p.VisitRecords)
                .HasForeignKey(d => d.AuthorizedEmployeeId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("visit_records_authorized_employee_id_fkey");

            entity.HasOne(d => d.Location).WithMany(p => p.VisitRecords)
                .HasForeignKey(d => d.LocationId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("visit_records_location_id_fkey");

            entity.HasOne(d => d.User).WithMany(p => p.VisitRecords)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("visit_records_user_id_fkey");

            entity.HasOne(d => d.Visitor).WithMany(p => p.VisitRecords)
                .HasForeignKey(d => d.VisitorId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("visit_records_visitor_id_fkey");
        });

        modelBuilder.Entity<Visitor>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("visitors_pkey");

            entity.ToTable("visitors", "visitors");

            entity.HasIndex(e => e.Identification, "visitors_identification_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Address)
                .HasMaxLength(255)
                .HasColumnName("address");
            entity.Property(e => e.BloodType)
                .HasMaxLength(10)
                .HasColumnName("blood_type");
            entity.Property(e => e.CompanyId).HasColumnName("company_id");
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.FirstName)
                .HasMaxLength(100)
                .HasColumnName("first_name");
            entity.Property(e => e.Gender)
                .HasMaxLength(20)
                .HasColumnName("gender");
            entity.Property(e => e.Identification)
                .HasMaxLength(50)
                .HasColumnName("identification");
            entity.Property(e => e.LastName)
                .HasMaxLength(100)
                .HasColumnName("last_name");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .HasColumnName("phone_number");
            entity.Property(e => e.Photo).HasColumnName("photo");

            entity.HasOne(d => d.Company).WithMany(p => p.Visitors)
                .HasForeignKey(d => d.CompanyId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("visitors_company_id_fkey");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
