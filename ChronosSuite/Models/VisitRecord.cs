using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class VisitRecord
{
    public int Id { get; set; }

    public int? VisitorId { get; set; }

    public DateTime? Timestamp { get; set; }

    public byte[]? Photo { get; set; }

    public int? UserId { get; set; }

    public int? AuthorizedEmployeeId { get; set; }

    public int? LocationId { get; set; }

    public string? CarriedObjects { get; set; }

    public virtual Employee? AuthorizedEmployee { get; set; }

    public virtual Location? Location { get; set; }

    public virtual User? User { get; set; }

    public virtual Visitor? Visitor { get; set; }
}
