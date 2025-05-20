using ChronosSuite.Models;
using ChronosSuite.Models.Dto.Location;
using DannteV2.Models.Dto.FiltersTable;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.Json;

namespace ChronosSuite.Controllers
{
    [Authorize]
    public class LocationController : Controller
    {
        private readonly PgDbContext _context;

        public LocationController(PgDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            ViewBag.Location = "active";
            return View();
        }

        [HttpPost]
        public IActionResult GetAll([FromBody] TableRequest<FilterLocation>? request)
        {
            try
            {
                if (request == null || request.filter == null)
                    return Json(new { success = false, message = "Solicitud inválida." });

                var query = _context.Locations.AsQueryable();

                // Aplicar filtros si están presentes
                if (!string.IsNullOrEmpty(request.filter.Id))
                {
                    if (long.TryParse(request.filter.Id, out long locationId))
                    {
                        query = query.Where(l => l.Id == locationId);
                    }
                }

                if (!string.IsNullOrEmpty(request.filter.Name))
                    query = query.Where(l => l.Name.Contains(request.filter.Name));

                if (!string.IsNullOrEmpty(request.filter.Description))
                    query = query.Where(l => l.Description != null && l.Description.Contains(request.filter.Description));

                // Aplicar ordenamiento
                if (!string.IsNullOrEmpty(request.sort))
                {
                    query = request.order == "desc"
                       ? request.sort.ToLower() switch
                       {
                           "id" => query.OrderByDescending(l => l.Id),
                           "name" => query.OrderByDescending(l => l.Name),
                           "description" => query.OrderByDescending(l => l.Description),
                           _ => query.OrderByDescending(l => EF.Property<object>(l, request.sort))
                       }
                       : request.sort.ToLower() switch
                       {
                           "id" => query.OrderBy(l => l.Id),
                           "name" => query.OrderBy(l => l.Name),
                           "description" => query.OrderBy(l => l.Description),
                           _ => query.OrderBy(l => EF.Property<object>(l, request.sort))
                       };
                }
                else
                {
                    query = query.OrderByDescending(l => l.Id);
                }

                // Aplicar paginación y seleccionar resultados
                var total = query.Count();
                var locations = query.Skip(request.offset)
                                 .Take(request.limit)
                                 .ToList()
                                 .Select(l => new LocationReadDto
                                 {
                                     Id = l.Id,
                                     Name = l.Name,
                                     Description = l.Description
                                 })
                                 .ToList();

                return Json(new { total, rows = locations });
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
                var role = await _context.Locations
                                            .AsNoTracking()
                                            .Select(p => new
                                            {
                                                value = p.Id,
                                                label = p.Name
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
    }
}