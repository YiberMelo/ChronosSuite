using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class Company
{
    public long Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();

    public virtual ICollection<Visitor> Visitors { get; set; } = new List<Visitor>();
}
