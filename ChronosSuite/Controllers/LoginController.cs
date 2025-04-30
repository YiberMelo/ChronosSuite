using ChronosSuite.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Security.Claims;
using ChronosSuite.Models.Dto;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using ChronosSuite.Tools;

namespace ChronosSuite.Controllers
{
    public class LoginController : Controller
    {
        private readonly PgDbContext _context;
        private readonly IConfiguration _config;
        private readonly TwoFactorService _twoFactorService;

        public LoginController(PgDbContext context, IConfiguration config, TwoFactorService twoFactorService)
        {
            _context = context;
            _config = config;
            _twoFactorService = twoFactorService;
        }

        public IActionResult Index()
        {
            if (User.Identity.IsAuthenticated)
            {
                return Redirect("/Home");
            }

            return View();
        }

        // Método para cerrar sesión
        [HttpGet]
        public async Task<IActionResult> SignOut()
        {
            // Cerrar sesión de la cookie de autenticación
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            
            // Redirigir a la página de inicio de sesión
            return RedirectToAction("Index", "Login");
        }

        private string GenerateToken(string userName, string userId)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_config["Jwt:Key"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
            new Claim(ClaimTypes.Name, userName),
            new Claim("UserId", userId)
        }),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:ExpireMinutes"])),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        [HttpPost]
        public async Task<IActionResult> SignIn([FromBody] LoginRequestDto model)
        {
            try
            {
                if (model == null)
                    return Json(new { success = false, message = "Datos inválidos." });

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == model.Username);

                if (user == null)
                    return Json(new { success = false, message = "Credenciales no válidas" });

                var crypto = new Crypto();
                crypto.LoadEncryptedPassword(user.Pswd, user.Salt);

                if (!crypto.VerifyPassword(model.Pswd))
                    return Json(new { success = false, message = "Credenciales no válidas" });

                if (user.TwoFactorEnabled == true && !model.SkipTwoFactor)
                {
                    return Json(new { success = true, require2fa = true, user = model.Username });
                }

                var identity = new ClaimsIdentity(CookieAuthenticationDefaults.AuthenticationScheme, ClaimTypes.Name, ClaimTypes.Role);
                identity.AddClaim(new Claim(ClaimTypes.Name, user.Username));
                identity.AddClaim(new Claim(ClaimTypes.Sid, user.Id.ToString()));

                var principal = new ClaimsPrincipal(identity);

                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal,
                    new AuthenticationProperties
                    {
                        ExpiresUtc = DateTime.UtcNow.AddHours(2),
                        IsPersistent = true
                    });

                // Generar un JWT
                var token = GenerateToken(user.Username, user.Id.ToString());
                return Json(new { success = true, token });
            }
            catch (FormatException e)
            {
                return Json(e.Message);
            }
            catch (NpgsqlException e)
            {
                return Json(e.Message);
            }
            catch (Exception e)
            {
                return Json(e.Message);
            }
        }

        [HttpPost]
        public IActionResult GenerateQrAndSecret(string username)
        {
            var result = _twoFactorService.GenerateSecret(username);
            if (!result.Success)
                return Json(new { success = false, message = result.Message });

            return Json(new
            {
                success = true,
                qrCodeImage = result.QrCode,
                manualCode = result.ManualCode
            });
        }

        [HttpPost]
        public async Task<IActionResult> VerifyCode(string username, string code)
        {
            var result = await _twoFactorService.VerifyCodeAsync(username, code);
            return Json(new { success = result.Success, message = result.Message });
        }

        [HttpPost]
        public IActionResult VerifyTempCode(string code, string secret)
        {
            if (string.IsNullOrEmpty(secret))
                return Json(new { success = false, message = "El secreto es requerido" });

            var totp = new OtpNet.Totp(OtpNet.Base32Encoding.ToBytes(secret));
            var valid = totp.VerifyTotp(code, out long _, OtpNet.VerificationWindow.RfcSpecifiedNetworkDelay);

            return Json(new { success = valid, message = valid ? "Código válido" : "Código incorrecto" });
        }

        [HttpPost]
        public async Task<IActionResult> SaveTwoFactorSecret(string username, string secret)
        {
            var result = await _twoFactorService.AssignTwoFactorSecretAsync(username, secret);
            return Json(new { success = result.Success, message = result.Message });
        }
    }
}
