using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class Employee
{
    public long Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Position { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public long CompanyId { get; set; }

    public virtual Company Company { get; set; } = null!;

    public virtual ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
}
