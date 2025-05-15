namespace ChronosSuite.Models.Dto.Location
{
    public class LocationReadDto
    {
        public long Id { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }
    }
}
