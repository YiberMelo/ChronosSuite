namespace ChronosSuite.Models.Dto.VisitRecord
{
    public class VisitRecordReadDto
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
        public bool HasEntered { get; set; }
        public string VisitPurpose { get; set; }
        public bool IsImmediateVisit { get; set; }
        public string? ReportDescription { get; set; }
        public DateTime ScheduledEntryTime { get; set; }
        public DateTime ScheduledExitTime { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime CreatedAt { get; set; }

        public string VisitorFullName { get; set; } 
        public string AuthorizedEmployeeFullName { get; set; }
        public string LocationName { get; set; }
    }
}
