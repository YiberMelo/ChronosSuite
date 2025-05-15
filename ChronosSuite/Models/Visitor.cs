using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class Visitor
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Identification { get; set; } = null!;

    public long? CompanyId { get; set; }

    public byte[]? Photo { get; set; }

    public string? Gender { get; set; }

    public string? BloodType { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? Address { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public virtual Company? Company { get; set; }

    public virtual ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
}
