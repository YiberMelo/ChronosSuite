using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class Location
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
}
