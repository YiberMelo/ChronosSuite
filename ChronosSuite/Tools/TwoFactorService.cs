using ChronosSuite.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using OtpNet;
using QRCoder;
using System;
using System.Text;
using System.Threading.Tasks;

namespace ChronosSuite.Tools
{
    public class TwoFactorService
    {
        private readonly PgDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TwoFactorService(PgDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public (bool Success, string QrCode, string ManualCode, string Message) GenerateSecret(string username)
        {
            // Generar una clave secreta aleatoria de 20 bytes
            var secretKey = KeyGeneration.GenerateRandomKey(20);
            var base32Secret = Base32Encoding.ToString(secretKey);

            string issuer = "ChronosSuite";
            string label = $"{issuer}:{username}";
            var otpUrl = $"otpauth://totp/{label}?secret={base32Secret}&issuer={issuer}";

            // Generar el código QR en formato PNG (Base64)
            var qrGenerator = new QRCodeGenerator();
            var qrCodeData = qrGenerator.CreateQrCode(otpUrl, QRCodeGenerator.ECCLevel.Q);
            var qrCode = new PngByteQRCode(qrCodeData);
            var qrCodeBytes = qrCode.GetGraphic(20);
            var qrBase64 = Convert.ToBase64String(qrCodeBytes);

            return (true, "data:image/png;base64," + qrBase64, base32Secret, "Secreto generado exitosamente.");
        }

        public async Task<(bool Success, string Message)> VerifyCodeAsync(string username, string code)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null || string.IsNullOrEmpty(user.Secret))
                return (false, "Usuario no encontrado o no tiene autenticación de dos factores habilitada.");

            var totp = new Totp(Base32Encoding.ToBytes(user.Secret));
            if (!totp.VerifyTotp(code, out long _, VerificationWindow.RfcSpecifiedNetworkDelay))
                return (false, "Código incorrecto.");

            return (true, "Código verificado correctamente.");
        }

        public async Task<(bool Success, string Message)> AssignTwoFactorSecretAsync(string username, string secret)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (user == null)
                return (false, "Usuario no encontrado.");

            if (user.TwoFactorEnabled == true)
                return (false, "El usuario ya tiene autenticación de dos factores activada.");

            user.Secret = secret;
            user.TwoFactorEnabled = true;
            await _context.SaveChangesAsync();

            return (true, "Autenticación en dos pasos activada exitosamente.");
        }
    }
}
