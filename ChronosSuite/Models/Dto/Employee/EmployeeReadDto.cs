namespace ChronosSuite.Models.Dto.Employee
{
    public class EmployeeReadDto
    {
        public long Id { get; set; }

        public string FirstName { get; set; } = null!;

        public string LastName { get; set; } = null!;

        public string Position { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string PhoneNumber { get; set; } = null!;

        public string Company { get; set; } = null!;

        public long CompanyId { get; set; }
    }
}
