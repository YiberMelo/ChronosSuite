namespace ChronosSuite.Models.Dto
{
    public class LoginRequestDto
    {
        public string Username { get; set; }
        public string Pswd { get; set; }
        public bool SkipTwoFactor { get; set; } = false;
    }
}
