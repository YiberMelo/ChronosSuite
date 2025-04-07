using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class User
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string Pswd { get; set; } = null!;

    public string? Salt { get; set; }

    public bool? TwoFactorEnabled { get; set; }

    public string? Secret { get; set; }

    public virtual ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
}
