using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChronosSuite.Models;

public partial class VisitRecord
{
    public int Id { get; set; }

    public int? VisitorId { get; set; }

    public DateTime? Timestamp { get; set; }
    
    [Column("entry_time")]
    public DateTime? EntryTime { get; set; }
    
    [Column("exit_time")]
    public DateTime? ExitTime { get; set; }
    
    [Column("has_exited")]
    public bool HasExited { get; set; }
    
    [Column("has_entered")]
    public bool HasEntered { get; set; }
    
    [Column("report_flag")]
    public bool ReportFlag { get; set; }
    
    [Column("visit_purpose")]
    public string? VisitPurpose { get; set; }

    public byte[]? Photo { get; set; }

    public int? UserId { get; set; }

    public int? AuthorizedEmployeeId { get; set; }

    public int? LocationId { get; set; }

    [Column("carried_objects")]
    public string? CarriedObjects { get; set; }

    public virtual Employee? AuthorizedEmployee { get; set; }

    public virtual Location? Location { get; set; }

    public virtual User? User { get; set; }

    public virtual Visitor? Visitor { get; set; }
}
