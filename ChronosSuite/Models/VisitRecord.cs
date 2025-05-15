using System;
using System.Collections.Generic;

namespace ChronosSuite.Models;

public partial class VisitRecord
{
    public long Id { get; set; }

    public long VisitorId { get; set; }

    public int UserId { get; set; }

    public long AuthorizedEmployeeId { get; set; }

    public long LocationId { get; set; }

    public string CarriedObjects { get; set; } = null!;

    public DateTime? EntryTime { get; set; }

    public DateTime? ExitTime { get; set; }

    public bool HasExited { get; set; }

    public bool ReportFlag { get; set; }

    /// <summary>
    /// Indica si el visitante ya registró su entrada
    /// </summary>
    public bool HasEntered { get; set; }

    /// <summary>
    /// Propósito principal de la visita
    /// </summary>
    public string VisitPurpose { get; set; } = null!;

    public bool IsImmediateVisit { get; set; }

    public string? ReportDescription { get; set; }

    public DateTime ScheduledEntryTime { get; set; }

    public DateTime ScheduledExitTime { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Employee AuthorizedEmployee { get; set; } = null!;

    public virtual Location Location { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual Visitor Visitor { get; set; } = null!;
}
