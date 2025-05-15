using ChronosSuite.Models;
using ChronosSuite.Models.Dto.Company;
using DannteV2.Models.Dto.FiltersTable;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ChronosSuite.Controllers
{
    [Authorize]
    public class CompanyController : Controller
    {
        private readonly PgDbContext _context;

        public CompanyController(PgDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            ViewBag.Company = "active";
            return View();
        }

        [HttpPost]
        public IActionResult GetAll([FromBody] TableRequest<FilterCompany>? request)
        {
            try
            {
                if (request == null || request.filter == null)
                    return Json(new { success = false, message = "Solicitud inválida." });

                var query = _context.Companies.AsQueryable();

                // Aplicar filtros si están presentes
                if (!string.IsNullOrEmpty(request.filter.Id))
                {
                    if (long.TryParse(request.filter.Id, out long companyId))
                    {
                        query = query.Where(c => c.Id == companyId);
                    }
                }

                if (!string.IsNullOrEmpty(request.filter.Name))
                    query = query.Where(c => c.Name.Contains(request.filter.Name));

                // Aplicar ordenamiento
                if (!string.IsNullOrEmpty(request.sort))
                {
                    query = request.order == "desc"
                       ? request.sort.ToLower() switch
                       {
                           "id" => query.OrderByDescending(c => c.Id),
                           "name" => query.OrderByDescending(c => c.Name),
                           _ => query.OrderByDescending(c => EF.Property<object>(c, request.sort))
                       }
                       : request.sort.ToLower() switch
                       {
                           "id" => query.OrderBy(c => c.Id),
                           "name" => query.OrderBy(c => c.Name),
                           _ => query.OrderBy(c => EF.Property<object>(c, request.sort))
                       };
                }
                else
                {
                    query = query.OrderByDescending(c => c.Id);
                }

                // Aplicar paginación y seleccionar resultados
                var total = query.Count();
                var companies = query.Skip(request.offset)
                                 .Take(request.limit)
                                 .ToList()
                                 .Select(c => new CompanyReadDto
                                 {
                                     Id = c.Id,
                                     Name = c.Name
                                 })
                                 .ToList();

                return Json(new { total, rows = companies });
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

        public async Task<IActionResult> GetList()
        {
            try
            {
                var companies = await _context.Companies
                    .OrderBy(c => c.Name)
                    .Select(c => new { label = c.Name, value = c.Id })
                    .ToListAsync();

                return Json(companies);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        public async Task<IActionResult> GetById(long id)
        {
            try
            {
                var company = await _context.Companies.FindAsync(id);

                if (company == null)
                {
                    return Json(new { success = false, message = "Empresa no encontrada." });
                }

                var companyDto = new CompanyReadDto
                {
                    Id = company.Id,
                    Name = company.Name
                };

                return Json(new { success = true, company = companyDto });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Save([FromBody] CompanySaveDto model)
        {
            if (model == null)
            {
                return Json(new { success = false, message = "Datos incorrectos" });
            }
            try
            {
                // Convertir el nombre a mayúsculas
                string nombreMayusculas = model.Name.ToUpper();

                var existingCompany = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Name == nombreMayusculas);

                if (existingCompany != null)
                {
                    return Json(new { success = false, message = "Ya existe una empresa con ese nombre." });
                }

                var company = new Company
                {
                    Name = nombreMayusculas // Guardamos el nombre en mayúsculas
                };

                _context.Companies.Add(company);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Empresa guardada exitosamente." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] CompanyUpdateDto model)
        {
            if (model == null || model.Id <= 0)
                return Json(new { success = false, message = "Empresa no válida." });

            try
            {
                var company = await _context.Companies.FindAsync(model.Id);

                if (company == null)
                {
                    return Json(new { success = false, message = "Empresa no encontrada." });
                }

                // Convertir el nombre a mayúsculas
                string nombreMayusculas = model.Name.ToUpper();

                var existingCompany = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Name == nombreMayusculas && c.Id != model.Id);

                if (existingCompany != null)
                {
                    return Json(new { success = false, message = "Ya existe una empresa con ese nombre." });
                }

                company.Name = nombreMayusculas; // Actualizamos el nombre en mayúsculas

                _context.Companies.Update(company);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Empresa actualizada exitosamente." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                if (id <= 0)
                {
                    return Json(new { success = false, message = "ID de empresa no válido." });
                }

                var company = await _context.Companies.FindAsync(id);

                if (company == null)
                {
                    return Json(new { success = false, message = "Empresa no encontrada." });
                }

                // Verificar si hay empleados o visitantes asociados a esta empresa
                var hasEmployees = await _context.Employees.AnyAsync(e => e.CompanyId == id);
                var hasVisitors = await _context.Visitors.AnyAsync(v => v.CompanyId == id);

                if (hasEmployees || hasVisitors)
                {
                    return Json(new { success = false, message = "No se puede eliminar esta empresa porque tiene empleados o visitantes asociados." });
                }

                _context.Companies.Remove(company);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Empresa eliminada exitosamente." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}