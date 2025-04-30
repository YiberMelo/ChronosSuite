using ChronosSuite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ChronosSuite.Controllers
{
    public class LocationController : Controller
    {
        private readonly PgDbContext _context;

        public LocationController(PgDbContext context)
        {
            _context = context;
        }

        // GET: Location
        public IActionResult Index()
        {
            return View();
        }

        // GET: Location/GetAll
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var locations = await _context.Locations
                    .Select(l => new
                    {
                        l.Id,
                        l.Name,
                        l.Description
                    })
                    .ToListAsync();
                
                return Json(new { success = true, data = locations });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // POST: Location/Create
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Location location)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    // Asegurar que el ID sea 0 para que PostgreSQL genere uno nuevo
                    location.Id = 0;

                    await _context.Locations.AddAsync(location);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = "Ubicación creada correctamente", data = location });
                }
                return Json(new { success = false, message = "Error en los datos proporcionados" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // GET: Location/GetById/5
        [HttpGet]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var location = await _context.Locations
                    .Select(l => new
                    {
                        l.Id,
                        l.Name,
                        l.Description
                    })
                    .FirstOrDefaultAsync(l => l.Id == id);
                
                if (location == null)
                {
                    return Json(new { success = false, message = "Ubicación no encontrada" });
                }
                return Json(new { success = true, data = location });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // POST: Location/Update
        [HttpPost]
        public async Task<IActionResult> Update([FromBody] Location location)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var existingLocation = await _context.Locations.FindAsync(location.Id);
                    if (existingLocation == null)
                    {
                        return Json(new { success = false, message = "Ubicación no encontrada" });
                    }

                    existingLocation.Name = location.Name;
                    existingLocation.Description = location.Description;
                    
                    _context.Locations.Update(existingLocation);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, message = "Ubicación actualizada correctamente" });
                }
                return Json(new { success = false, message = "Error en los datos proporcionados" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // DELETE: Location/Delete/5
        [HttpDelete]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var location = await _context.Locations.FindAsync(id);
                if (location == null)
                {
                    return Json(new { success = false, message = "Ubicación no encontrada" });
                }

                // Verificar si hay registros de visitas asociados a esta ubicación
                var hasVisitRecords = await _context.VisitRecords.AnyAsync(vr => vr.LocationId == id);
                if (hasVisitRecords)
                {
                    return Json(new { success = false, message = "No se puede eliminar la ubicación porque tiene registros de visitas asociados" });
                }

                _context.Locations.Remove(location);
                await _context.SaveChangesAsync();
                return Json(new { success = true, message = "Ubicación eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}