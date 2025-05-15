namespace ChronosSuite.Models.Dto.Visitor
{
    public class VisitorReadDto
    {
        public long Id { get; set; }

        public string FirstName { get; set; } 

        public string LastName { get; set; } 

        public string Identification { get; set; } 

        public string Company { get; set; }

        public long? CompanyId { get; set; }

        public string Photo { get; set; }

        public string? Gender { get; set; }

        public string? BloodType { get; set; }

        public string? PhoneNumber { get; set; }

        public string? Email { get; set; }

        public string? Address { get; set; }

        public DateOnly? DateOfBirth { get; set; }
    }
}
