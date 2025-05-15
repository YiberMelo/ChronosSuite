namespace ChronosSuite.Models.Dto.VisitRecord
{
    public class VisitRecordSaveDto
    {
        public int VisitorId { get; set; }

        public int AuthorizedEmployeeId { get; set; }

        public int LocationId { get; set; }

        public string CarriedObjects { get; set; }

        public string VisitPurpose { get; set; }

        public bool IsImmediateVisit { get; set; }

        public string ScheduledEntryTime { get; set; }

        public string ScheduledExitTime { get; set; }

    }
}
