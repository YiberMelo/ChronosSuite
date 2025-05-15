using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class Location
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
}
