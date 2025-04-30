using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class Employee
{
    public int Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string? Position { get; set; }

    public string Email { get; set; } = null!;

    public string? PhoneNumber { get; set; }
    
    public int? CompanyId { get; set; }

    public virtual Company? Company { get; set; }

    public virtual ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
}
