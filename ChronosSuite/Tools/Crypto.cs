using System;
using System.Security.Cryptography;

namespace ChronosSuite.Tools
{
    public class Crypto
    {
        public string Pswd { get; private set; } = string.Empty;
        public string Salt { get; private set; } = string.Empty;

        public void LoadEncryptedPassword(string encryptedPassword, string salt)
        {
            Pswd = encryptedPassword ?? throw new ArgumentNullException(nameof(encryptedPassword));
            Salt = salt ?? throw new ArgumentNullException(nameof(salt));
        }

        public void SetPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                throw new ArgumentNullException(nameof(password));

            byte[] saltBytes = RandomNumberGenerator.GetBytes(16); 

            using (var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, 100000, HashAlgorithmName.SHA256))
            {
                byte[] hashBytes = pbkdf2.GetBytes(32);
                Pswd = Convert.ToBase64String(hashBytes);
                Salt = Convert.ToBase64String(saltBytes);
            }
        }

        public bool VerifyPassword(string password)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(Salt) || string.IsNullOrEmpty(Pswd))
                return false;

            byte[] saltBytes = Convert.FromBase64String(Salt);

            using (var pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, 100000, HashAlgorithmName.SHA256))
            {
                byte[] hashBytes = pbkdf2.GetBytes(32);
                string hashedPassword = Convert.ToBase64String(hashBytes);
                return hashedPassword == Pswd;
            }
        }
    }
}
