using ChronosSuite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ChronosSuite.Controllers
{
    public class VisitorController : Controller
    {
        private readonly PgDbContext _context;

        public VisitorController(PgDbContext context)
        {
            _context = context;
        }

        // GET: /Visitor
        public IActionResult Index()
        {
            return View();
        }

        // GET: /Visitor/GetData
        [HttpGet]
        public async Task<IActionResult> GetData()
        {
            try
            {
                var visitors = await _context.Visitors
                    .Include(v => v.Company)
                    .Select(v => new
                    {
                        v.Id,
                        v.FirstName,
                        v.LastName,
                        v.Identification,
                        v.CompanyId,
                        CompanyName = v.Company != null ? v.Company.Name : "Sin empresa",
                        v.Gender,
                        v.BloodType,
                        v.PhoneNumber,
                        v.Email,
                        v.Address,
                        v.DateOfBirth,
                        PhotoBase64 = v.Photo != null ? Convert.ToBase64String(v.Photo) : null
                    })
                    .ToListAsync();

                return Json(visitors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: /Visitor/GetById/5
        [HttpGet]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var visitor = await _context.Visitors
                    .Include(v => v.Company)
                    .Select(v => new
                    {
                        v.Id,
                        v.FirstName,
                        v.LastName,
                        v.Identification,
                        v.CompanyId,
                        CompanyName = v.Company != null ? v.Company.Name : "Sin empresa",
                        v.Gender,
                        v.BloodType,
                        v.PhoneNumber,
                        v.Email,
                        v.Address,
                        v.DateOfBirth,
                        PhotoBase64 = v.Photo != null ? Convert.ToBase64String(v.Photo) : null
                    })
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (visitor == null)
                {
                    return Json(new { success = false, message = "Visitante no encontrado" });
                }

                return Json(new { success = true, data = visitor });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /Visitor/Create
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] JsonElement data)
        {
            try
            {
                var visitor = new Visitor
                {
                    FirstName = data.GetProperty("firstName").GetString(),
                    LastName = data.GetProperty("lastName").GetString(),
                    Identification = data.GetProperty("identification").GetString(),
                    Gender = data.TryGetProperty("gender", out var genderElement) ? genderElement.GetString() : null,
                    BloodType = data.TryGetProperty("bloodType", out var bloodTypeElement) ? bloodTypeElement.GetString() : null,
                    PhoneNumber = data.TryGetProperty("phoneNumber", out var phoneElement) ? phoneElement.GetString() : null,
                    Email = data.TryGetProperty("email", out var emailElement) ? emailElement.GetString() : null,
                    Address = data.TryGetProperty("address", out var addressElement) ? addressElement.GetString() : null
                };

                // Convertir DateOnly si existe
                if (data.TryGetProperty("dateOfBirth", out var dateElement) && !dateElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    var dateString = dateElement.GetString();
                    if (DateOnly.TryParse(dateString, out var dateOnly))
                    {
                        visitor.DateOfBirth = dateOnly;
                    }
                }

                // Convertir CompanyId si existe
                if (data.TryGetProperty("companyId", out var companyElement) && !companyElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitor.CompanyId = companyElement.GetInt32();
                }

                // Convertir foto base64 a byte[] si existe
                if (data.TryGetProperty("photoBase64", out var photoElement) && !photoElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    var base64String = photoElement.GetString();
                    if (!string.IsNullOrEmpty(base64String))
                    {
                        // Quitar prefijo "data:image/..." si existe
                        if (base64String.Contains(","))
                        {
                            base64String = base64String.Split(',')[1];
                        }
                        visitor.Photo = Convert.FromBase64String(base64String);
                    }
                }

                await _context.Visitors.AddAsync(visitor);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Visitante creado correctamente", data = visitor.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /Visitor/Update
        [HttpPost]
        public async Task<IActionResult> Update([FromBody] JsonElement data)
        {
            try
            {
                int id = data.GetProperty("id").GetInt32();
                var visitor = await _context.Visitors.FindAsync(id);

                if (visitor == null)
                {
                    return NotFound(new { success = false, message = "Visitante no encontrado" });
                }

                visitor.FirstName = data.GetProperty("firstName").GetString();
                visitor.LastName = data.GetProperty("lastName").GetString();
                visitor.Identification = data.GetProperty("identification").GetString();
                visitor.Gender = data.TryGetProperty("gender", out var genderElement) ? genderElement.GetString() : null;
                visitor.BloodType = data.TryGetProperty("bloodType", out var bloodTypeElement) ? bloodTypeElement.GetString() : null;
                visitor.PhoneNumber = data.TryGetProperty("phoneNumber", out var phoneElement) ? phoneElement.GetString() : null;
                visitor.Email = data.TryGetProperty("email", out var emailElement) ? emailElement.GetString() : null;
                visitor.Address = data.TryGetProperty("address", out var addressElement) ? addressElement.GetString() : null;

                // Convertir DateOnly si existe
                if (data.TryGetProperty("dateOfBirth", out var dateElement) && !dateElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    var dateString = dateElement.GetString();
                    if (DateOnly.TryParse(dateString, out var dateOnly))
                    {
                        visitor.DateOfBirth = dateOnly;
                    }
                }
                else
                {
                    visitor.DateOfBirth = null;
                }

                // Convertir CompanyId si existe
                if (data.TryGetProperty("companyId", out var companyElement) && !companyElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitor.CompanyId = companyElement.GetInt32();
                }
                else
                {
                    visitor.CompanyId = null;
                }

                // Actualizar foto si se proporciona una nueva
                if (data.TryGetProperty("photoBase64", out var photoElement) && !photoElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    var base64String = photoElement.GetString();
                    if (!string.IsNullOrEmpty(base64String))
                    {
                        // Quitar prefijo "data:image/..." si existe
                        if (base64String.Contains(","))
                        {
                            base64String = base64String.Split(',')[1];
                        }
                        visitor.Photo = Convert.FromBase64String(base64String);
                    }
                }

                _context.Visitors.Update(visitor);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Visitante actualizado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE: /Visitor/Delete/5
        [HttpDelete]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var visitor = await _context.Visitors.FindAsync(id);
                if (visitor == null)
                {
                    return NotFound(new { success = false, message = "Visitante no encontrado" });
                }

                // Verificar si existen registros de visitas asociados
                var hasVisits = await _context.VisitRecords.AnyAsync(vr => vr.VisitorId == id);
                if (hasVisits)
                {
                    return Json(new { success = false, message = "No se puede eliminar el visitante porque tiene registros de visitas asociados" });
                }

                _context.Visitors.Remove(visitor);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Visitante eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}