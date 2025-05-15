namespace DannteV2.Models.Dto.FiltersTable
{
    public class TableRequest<TFilter>
    {
        public int limit { get; set; }
        public int offset { get; set; }
        public string sort { get; set; }
        public string order { get; set; }
        public string search { get; set; }
        public TFilter filter { get; set; }

        // Constructor sin parámetros
        public TableRequest() { }
    }

    public class FilterVisitRecord
    {
        // Propiedades principales de VisitRecord
        public long Id { get; set; }
        public long VisitorId { get; set; }
        public int UserId { get; set; }
        public long AuthorizedEmployeeId { get; set; }
        public long LocationId { get; set; }
        public string CarriedObjects { get; set; }
        public string EntryTime { get; set; }
        public string ExitTime { get; set; }
        public bool HasExited { get; set; }
        public bool ReportFlag { get; set; }
        public bool HasEntered { get; set; }
        public string VisitPurpose { get; set; }
        public bool IsImmediateVisit { get; set; }
        public string? ReportDescription { get; set; }
        public string ScheduledEntryTime { get; set; }
        public string ScheduledExitTime { get; set; }
        public string UpdatedAt { get; set; }
        public string CreatedAt { get; set; }

        public string VisitorFullName { get; set; }
        public string AuthorizedEmployeeFullName { get; set; }
        public string LocationName { get; set; } 
    }
    public class FilterVisitor
    {
        public string FirstName { get; set; } = null!;

        public string LastName { get; set; } = null!;

        public string Identification { get; set; } = null!;

        public string? Company { get; set; }

        public string? Gender { get; set; }

        public string? BloodType { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public string? Address { get; set; }

    }    public class FilterLocation
    {
        public string? Id { get; set; }
        
        public string? Name { get; set; }

        public string? Description { get; set; }
    }    public class FilterCompany
    {
        public string? Id { get; set; }
        
        public string? Name { get; set; }
    }

    public class FilterEmployee
    {
        public string? Id { get; set; }
        
        public string? FirstName { get; set; }
        
        public string? LastName { get; set; }
        
        public string? Position { get; set; }
        
        public string? Email { get; set; }
        
        public string? PhoneNumber { get; set; }
        
        public string? Company { get; set; }
    }

}

