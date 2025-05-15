using ChronosSuite.Models;
using ChronosSuite.Models.Dto.Visitor;
using ChronosSuite.Models.Dto.VisitRecord;
using ChronosSuite.Tools;
using DannteV2.Models.Dto.FiltersTable;
using ImageMagick;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using OntimerSuite.Tools;
using System.ComponentModel.Design;
using System.Text.Json;

namespace ChronosSuite.Controllers
{
    [Authorize]
    public class VisitorController : Controller
    {
        private readonly PgDbContext _context;

        private ImageManager _imageManager = new ImageManager();

        public VisitorController(PgDbContext context)
        {
            _context = context;
        }
        public IActionResult Index()
        {
            ViewBag.Visitor = "active";
            return View();
        }


        [HttpPost]
        public IActionResult GetAll([FromBody] TableRequest<FilterVisitor>? request)
        {
            try
            {
                if (request == null || request.filter == null)
                    return Json(new { success = false, message = "Solicitud inválida." });

                var query = _context.Visitors
                                    .Include(v => v.Company)
                                    .AsQueryable();

                if (!string.IsNullOrEmpty(request.filter.FirstName))
                    query = query.Where(wb => wb.FirstName.Contains(request.filter.FirstName));

                if (!string.IsNullOrEmpty(request.filter.LastName))
                    query = query.Where(wb => wb.LastName.Contains(request.filter.LastName));

                if (!string.IsNullOrEmpty(request.filter.Identification))
                    query = query.Where(wb => wb.Identification.Contains(request.filter.Identification));

                if (!string.IsNullOrEmpty(request.filter.Company))
                {
                    query = query.Where(vr => vr.Company != null && vr.Company.Name.Contains(request.filter.Company));
                }

                if (!string.IsNullOrEmpty(request.filter.Gender))
                    query = query.Where(wb => wb.Gender.Contains(request.filter.Gender));

                if (!string.IsNullOrEmpty(request.filter.BloodType))
                    query = query.Where(wb => wb.BloodType.Contains(request.filter.BloodType));

                if (!string.IsNullOrEmpty(request.filter.PhoneNumber))
                    query = query.Where(wb => wb.PhoneNumber.Contains(request.filter.PhoneNumber));

                if (!string.IsNullOrEmpty(request.filter.Email))
                    query = query.Where(wb => wb.Email.Contains(request.filter.Email));

                if (!string.IsNullOrEmpty(request.filter.Address))
                    query = query.Where(wb => wb.Address.Contains(request.filter.Address));

                if (!string.IsNullOrEmpty(request.sort))
                {
                    query = request.order == "desc"
                       ? request.sort.ToLower() switch
                       {
                           "firstname" => query.OrderByDescending(wb => wb.FirstName),
                           "lastname" => query.OrderByDescending(wb => wb.LastName),
                           "identification" => query.OrderByDescending(wb => wb.Identification),
                           "company" => query.OrderByDescending(wb => wb.Company),
                           "gender" => query.OrderByDescending(wb => wb.Gender),
                           "bloodtype" => query.OrderByDescending(wb => wb.BloodType),
                           "phonenumber" => query.OrderByDescending(wb => wb.PhoneNumber),
                           "email" => query.OrderByDescending(wb => wb.Email),
                           "address" => query.OrderByDescending(wb => wb.Address),
                           _ => query.OrderByDescending(wb => EF.Property<object>(wb, request.sort))
                       }
                       : request.sort.ToLower() switch
                       {
                           "firstname" => query.OrderBy(wb => wb.FirstName),
                           "lastname" => query.OrderBy(wb => wb.LastName),
                           "identification" => query.OrderBy(wb => wb.Identification),
                           "company" => query.OrderBy(wb => wb.Company),
                           "gender" => query.OrderBy(wb => wb.Gender),
                           "bloodtype" => query.OrderBy(wb => wb.BloodType),
                           "phonenumber" => query.OrderBy(wb => wb.PhoneNumber),
                           "email" => query.OrderBy(wb => wb.Email),
                           "address" => query.OrderBy(wb => wb.Address),
                           _ => query.OrderBy(wb => EF.Property<object>(wb, request.sort))
                       };
                }
                else
                {
                    query = query.OrderByDescending(wb => wb.Id);
                }

                var total = query.Count();
                var visit = query.Skip(request.offset)
                                 .Take(request.limit)
                                 .ToList()
                                 .Select(p => new VisitorReadDto
                                 {
                                     Id = p.Id,
                                     Photo = _imageManager.ConvertImageToBase64(p.Photo),
                                     FirstName = p.FirstName,
                                     LastName = p.LastName,
                                     Identification = p.Identification,
                                     Company = p.Company != null ? p.Company.Name : "Sin empresa",
                                     Gender = p.Gender,
                                     BloodType = p.BloodType,
                                     PhoneNumber = p.PhoneNumber,
                                     Email = p.Email,
                                     Address = p.Address,
                                     DateOfBirth = p.DateOfBirth
                                 })
                                 .ToList();
                return Json(new { total, rows = visit });

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

        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var visitor = await _context.Visitors
                                         .AsNoTracking()
                                         .FirstOrDefaultAsync(p => p.Id == id);

                if (visitor == null)
                {
                    return Json(new { success = false, message = "Visitante no encontrado." });
                }

                var dtoVisitor = new VisitorReadDto
                {
                    Id = visitor.Id,
                    FirstName = visitor.FirstName,
                    LastName = visitor.LastName,
                    Identification = visitor.Identification,
                    CompanyId = visitor.CompanyId,
                    Gender = visitor.Gender,
                    BloodType = visitor.BloodType,
                    PhoneNumber = visitor.PhoneNumber,
                    Email = visitor.Email,
                    Address = visitor.Address,
                    Photo = visitor.Photo != null ? $"data:image/jpeg;base64,{Convert.ToBase64String(visitor.Photo)}" : null,
                    DateOfBirth = visitor.DateOfBirth
                };

                return Json(new { success = true, visitor = dtoVisitor });
            }
            catch (FormatException e)
            {
                return Json(new { success = false, error = e.Message });
            }
            catch (NpgsqlException e)
            {
                return Json(new { success = false, error = e.Message });
            }
            catch (Exception e)
            {
                return Json(new { success = false, error = e.Message });
            }
        }

        public async Task<IActionResult> GetList()
        {
            try
            {
                var role = await _context.Visitors
                                            .AsNoTracking()
                                            .Select(p => new
                                            {
                                                value = p.Id,
                                                label = $"{p.FirstName} {p.LastName}"
                                            })
                                            .ToListAsync();
                return Json(role);
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
        public async Task<IActionResult> Save([FromBody] VisitorSaveDto model)
        {
            if (model == null)
            {
                return Json(new { success = false, message = "Datos incorrectos" });
            }
            try
            {
                var existingVisitor = await _context.Visitors
                    .FirstOrDefaultAsync(u => u.Identification == model.Identification);
                if (existingVisitor != null)
                    return Json(new { success = false, message = "El visitante ya está en existe." });

                var visitor = new Visitor
                {
                    FirstName= model.FirstName,
                    LastName = model.LastName,
                    Identification= model.Identification,
                    CompanyId = model.CompanyId,
                    Gender = model.Gender,
                    BloodType = model.BloodType,
                    PhoneNumber = model.PhoneNumber,
                    Email = model.Email,
                    Address = model.Address,
                    DateOfBirth = DateOnly.Parse(model.DateOfBirth),
                };

                if (!string.IsNullOrEmpty(model.Photo))
                {
                    if (!_imageManager.IsBase64String(model.Photo))
                        return Json(new { success = false, message = "Datos inválidos" });

                    try
                    {
                        string cleanBase64 = model.Photo;
                        if (model.Photo.StartsWith("data:image/"))
                        {
                            var base64Index = model.Photo.IndexOf("base64,") + "base64,".Length;
                            cleanBase64 = model.Photo.Substring(base64Index);
                        }

                        var photoBytes = Convert.FromBase64String(cleanBase64);

                        using (var originalStream = new MemoryStream(photoBytes))
                        using (var image = new MagickImage(originalStream))
                        {
                            using (var resizedPhotoStream = _imageManager.ResizeAndCompressImage(image, 500, 500, 90))
                                visitor.Photo = resizedPhotoStream.ToArray();
                        }
                    }
                    catch
                    {
                        return Json(new { success = false, message = "Datos inválidos" });
                    }
                }

                _context.Visitors.Add(visitor);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Vistante guardado exitosamente" });
            }
            catch (FormatException e)
            {
                return Json(new { success = false, message = $"Error de formato: {e.Message}" });
            }
            catch (NpgsqlException e)
            {
                return Json(new { success = false, message = $"Error en base de datos: {e.Message}" });
            }
            catch (Exception e)
            {
                return Json(new { success = false, message = $"Error inesperado: {e.Message}" });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] VisitorUpdateDto model)
        {
            if (model == null || model.Id <= 0)
                return Json(new { success = false, message = "Visitante no valido." });

            try
            {
                var visitor = await _context.Visitors.FirstOrDefaultAsync(u => u.Id == model.Id);
                if (visitor == null)
                    return Json(new { success = false, message = "Visitante no encontrado." });

                visitor.FirstName = model.FirstName;
                visitor.LastName = model.LastName;
                visitor.Identification = model.Identification;
                visitor.CompanyId = model.CompanyId;
                visitor.Gender= model.Gender;
                visitor.BloodType = model.BloodType;
                visitor.PhoneNumber = model.PhoneNumber;
                visitor.Email = model.Email;
                visitor.Address = model.Address;

                if (!string.IsNullOrEmpty(model.Photo))
                {
                    if (!_imageManager.IsBase64String(model.Photo))
                        return Json(new { success = false, message = "Datos inválidos" });

                    try
                    {
                        string cleanBase64 = model.Photo;
                        if (model.Photo.StartsWith("data:image/"))
                        {
                            var base64Index = model.Photo.IndexOf("base64,") + "base64,".Length;
                            cleanBase64 = model.Photo.Substring(base64Index);
                        }

                        var photoBytes = Convert.FromBase64String(cleanBase64);

                        using (var originalStream = new MemoryStream(photoBytes))
                        using (var image = new MagickImage(originalStream))
                        {
                            using (var resizedPhotoStream = _imageManager.ResizeAndCompressImage(image, 500, 500, 90))
                                visitor.Photo = resizedPhotoStream.ToArray();
                        }
                    }
                    catch
                    {
                        return Json(new { success = false, message = "Datos inválidos" });
                    }
                }

                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Visitante actualizado exitosamente"});
            }
            catch (FormatException e)
            {
                return Json(new { success = false, message = $"Error de formato: {e.Message}" });
            }
            catch (NpgsqlException e)
            {
                return Json(new { success = false, message = $"Error en base de datos: {e.Message}" });
            }
            catch (Exception e)
            {
                return Json(new { success = false, message = $"Error inesperado: {e.Message}" });
            }
        }

        [HttpDelete]
        public IActionResult Delete(long id)
        {
            try
            {
                if (id <= 0)
                    return Json(new { success = false, message = "Visitante invalido." });

                var visitor = _context.Visitors.FirstOrDefault(l => l.Id == id);

                if (visitor == null)
                    return Json(new { success = false, message = "Visitante no encontrado." });

                _context.Visitors.Remove(visitor);
                _context.SaveChanges();

                return Json(new { success = true, message = "Visitante eliminado exitosamente." });
            }
            catch (FormatException e)
            {
                return Json(new { success = false, errorMessage = $"Error al eliminar: {e.Message}" });
            }
            catch (NpgsqlException e)
            {
                return Json(new { success = false, errorMessage = $"Error al eliminar: {e.Message}" });
            }
            catch (Exception e)
            {
                return Json(new { success = false, errorMessage = $"Error inesperado: {e.Message}" });
            }
        }
    }
}