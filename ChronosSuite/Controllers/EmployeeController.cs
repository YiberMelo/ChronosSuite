using ChronosSuite.Models;
using ChronosSuite.Models.Dto.Employee;
using DannteV2.Models.Dto.FiltersTable;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ChronosSuite.Controllers
{
    [Authorize]
    public class EmployeeController : Controller
    {
        private readonly PgDbContext _context;

        public EmployeeController(PgDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            ViewBag.Employee = "active";
            return View();
        }

        [HttpPost]
        public IActionResult GetAll([FromBody] TableRequest<FilterEmployee>? request)
        {
            try
            {
                if (request == null || request.filter == null)
                    return Json(new { success = false, message = "Solicitud inválida." });

                var query = _context.Employees
                                    .Include(e => e.Company)
                                    .AsQueryable();

                // Aplicar filtros si están presentes
                if (!string.IsNullOrEmpty(request.filter.Id))
                {
                    if (long.TryParse(request.filter.Id, out long employeeId))
                    {
                        query = query.Where(e => e.Id == employeeId);
                    }
                }

                if (!string.IsNullOrEmpty(request.filter.FirstName))
                    query = query.Where(e => e.FirstName.Contains(request.filter.FirstName));

                if (!string.IsNullOrEmpty(request.filter.LastName))
                    query = query.Where(e => e.LastName.Contains(request.filter.LastName));

                if (!string.IsNullOrEmpty(request.filter.Position))
                    query = query.Where(e => e.Position.Contains(request.filter.Position));

                if (!string.IsNullOrEmpty(request.filter.Email))
                    query = query.Where(e => e.Email.Contains(request.filter.Email));

                if (!string.IsNullOrEmpty(request.filter.PhoneNumber))
                    query = query.Where(e => e.PhoneNumber.Contains(request.filter.PhoneNumber));

                if (!string.IsNullOrEmpty(request.filter.Company))
                {
                    query = query.Where(e => e.Company != null && e.Company.Name.Contains(request.filter.Company));
                }

                // Aplicar ordenamiento
                if (!string.IsNullOrEmpty(request.sort))
                {
                    query = request.order == "desc"
                       ? request.sort.ToLower() switch
                       {
                           "id" => query.OrderByDescending(e => e.Id),
                           "firstname" => query.OrderByDescending(e => e.FirstName),
                           "lastname" => query.OrderByDescending(e => e.LastName),
                           "position" => query.OrderByDescending(e => e.Position),
                           "email" => query.OrderByDescending(e => e.Email),
                           "phonenumber" => query.OrderByDescending(e => e.PhoneNumber),
                           "company" => query.OrderByDescending(e => e.Company.Name),
                           _ => query.OrderByDescending(e => EF.Property<object>(e, request.sort))
                       }
                       : request.sort.ToLower() switch
                       {
                           "id" => query.OrderBy(e => e.Id),
                           "firstname" => query.OrderBy(e => e.FirstName),
                           "lastname" => query.OrderBy(e => e.LastName),
                           "position" => query.OrderBy(e => e.Position),
                           "email" => query.OrderBy(e => e.Email),
                           "phonenumber" => query.OrderBy(e => e.PhoneNumber),
                           "company" => query.OrderBy(e => e.Company.Name),
                           _ => query.OrderBy(e => EF.Property<object>(e, request.sort))
                       };
                }
                else
                {
                    query = query.OrderByDescending(e => e.Id);
                }

                // Aplicar paginación y seleccionar resultados
                var total = query.Count();
                var employees = query.Skip(request.offset)
                                 .Take(request.limit)
                                 .ToList()
                                 .Select(e => new EmployeeReadDto
                                 {
                                     Id = e.Id,
                                     FirstName = e.FirstName,
                                     LastName = e.LastName,
                                     Position = e.Position,
                                     Email = e.Email,
                                     PhoneNumber = e.PhoneNumber,
                                     Company = e.Company?.Name ?? "Sin empresa",
                                     CompanyId = e.CompanyId
                                 })
                                 .ToList();

                return Json(new { total, rows = employees });
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
                var employees = await _context.Employees
                    .OrderBy(e => e.FirstName)
                    .ThenBy(e => e.LastName)
                    .Select(e => new { label = $"{e.FirstName} {e.LastName}", value = e.Id })
                    .ToListAsync();

                return Json(employees);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}