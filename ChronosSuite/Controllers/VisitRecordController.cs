using ChronosSuite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ChronosSuite.Controllers
{
    public class VisitRecordController : Controller
    {
        private readonly PgDbContext _context;

        public VisitRecordController(PgDbContext context)
        {
            _context = context;
        }

        // GET: /VisitRecord
        public IActionResult Index()
        {
            return View();
        }

        // GET: /VisitRecord/GetData
        [HttpGet]
        public async Task<IActionResult> GetData()
        {
            try
            {
                var visitRecords = await _context.VisitRecords
                    .Include(vr => vr.Visitor)
                    .Include(vr => vr.AuthorizedEmployee)
                    .Include(vr => vr.Location)
                    .Include(vr => vr.User)
                    .Select(vr => new
                    {
                        vr.Id,
                        vr.VisitorId,
                        VisitorName = vr.Visitor != null ? $"{vr.Visitor.FirstName} {vr.Visitor.LastName}" : "Sin visitante",
                        VisitorIdentification = vr.Visitor != null ? vr.Visitor.Identification : "",
                        vr.Timestamp,
                        FormattedTimestamp = vr.Timestamp.HasValue ? vr.Timestamp.Value.ToString("dd/MM/yyyy HH:mm") : "",
                        vr.EntryTime,
                        FormattedEntryTime = vr.EntryTime.HasValue ? vr.EntryTime.Value.ToString("dd/MM/yyyy HH:mm") : "",
                        vr.ExitTime,
                        FormattedExitTime = vr.ExitTime.HasValue ? vr.ExitTime.Value.ToString("dd/MM/yyyy HH:mm") : "",
                        vr.HasExited,
                        vr.HasEntered,
                        vr.ReportFlag,
                        vr.VisitPurpose,
                        vr.AuthorizedEmployeeId,
                        AuthorizedEmployeeName = vr.AuthorizedEmployee != null ? $"{vr.AuthorizedEmployee.FirstName} {vr.AuthorizedEmployee.LastName}" : "No especificado",
                        vr.LocationId,
                        LocationName = vr.Location != null ? vr.Location.Name : "No especificado",
                        vr.UserId,
                        UserName = vr.User != null ? vr.User.Username : "No especificado",
                        vr.CarriedObjects,
                        PhotoBase64 = vr.Photo != null ? Convert.ToBase64String(vr.Photo) : null
                    })
                    .OrderByDescending(vr => vr.Timestamp)
                    .ToListAsync();

                return Json(visitRecords);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // GET: /VisitRecord/GetById/5
        [HttpGet]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var visitRecord = await _context.VisitRecords
                    .Include(vr => vr.Visitor)
                    .Include(vr => vr.AuthorizedEmployee)
                    .Include(vr => vr.Location)
                    .Include(vr => vr.User)
                    .Select(vr => new
                    {
                        vr.Id,
                        vr.VisitorId,
                        VisitorName = vr.Visitor != null ? $"{vr.Visitor.FirstName} {vr.Visitor.LastName}" : "Sin visitante",
                        VisitorIdentification = vr.Visitor != null ? vr.Visitor.Identification : "",
                        vr.Timestamp,
                        FormattedTimestamp = vr.Timestamp.HasValue ? vr.Timestamp.Value.ToString("dd/MM/yyyy HH:mm") : "",
                        vr.EntryTime,
                        FormattedEntryTime = vr.EntryTime.HasValue ? vr.EntryTime.Value.ToString("dd/MM/yyyy HH:mm") : "",
                        vr.ExitTime,
                        FormattedExitTime = vr.ExitTime.HasValue ? vr.ExitTime.Value.ToString("dd/MM/yyyy HH:mm") : "",
                        vr.HasExited,
                        vr.HasEntered,
                        vr.ReportFlag,
                        vr.VisitPurpose,
                        vr.AuthorizedEmployeeId,
                        AuthorizedEmployeeName = vr.AuthorizedEmployee != null ? $"{vr.AuthorizedEmployee.FirstName} {vr.AuthorizedEmployee.LastName}" : "No especificado",
                        vr.LocationId,
                        LocationName = vr.Location != null ? vr.Location.Name : "No especificado",
                        vr.UserId,
                        UserName = vr.User != null ? vr.User.Username : "No especificado",
                        vr.CarriedObjects,
                        PhotoBase64 = vr.Photo != null ? Convert.ToBase64String(vr.Photo) : null
                    })
                    .FirstOrDefaultAsync(vr => vr.Id == id);

                if (visitRecord == null)
                {
                    return Json(new { success = false, message = "Registro de visita no encontrado" });
                }

                return Json(new { success = true, data = visitRecord });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /VisitRecord/Create
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] JsonElement data)
        {
            try
            {
                // Obtener información del usuario actual (para pruebas, usaremos el primer usuario)
                var currentUser = await _context.Users.FirstOrDefaultAsync();
                if (currentUser == null)
                {
                    return Json(new { success = false, message = "No hay usuarios registrados en el sistema" });
                }

                var visitRecord = new VisitRecord
                {
                    VisitorId = data.GetProperty("visitorId").GetInt32(),
                    Timestamp = DateTime.Now,
                    UserId = currentUser.Id, // ID del usuario que registra la visita
                    CarriedObjects = data.TryGetProperty("carriedObjects", out var carriedObjectsElement) ?
                                     carriedObjectsElement.GetString() : null,
                    HasExited = false, // Por defecto, el visitante no ha salido
                    HasEntered = false, // Por defecto, el visitante no ha entrado
                    ReportFlag = false // Por defecto, no está marcado para reporte
                };

                // Verificar si es visita inmediata
                bool isImmediateVisit = false;
                if (data.TryGetProperty("isImmediateVisit", out var immediateVisitElement) && 
                    !immediateVisitElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    isImmediateVisit = immediateVisitElement.GetBoolean();
                }

                // Manejar la hora de entrada según el tipo de visita
                if (isImmediateVisit)
                {
                    // Si es visita inmediata, registrar la hora actual como hora de entrada
                    visitRecord.EntryTime = DateTime.Now;
                    visitRecord.HasEntered = true; // Marcar que el visitante ya entró
                }
                else if (data.TryGetProperty("entryTime", out var entryTimeElement) && 
                    !entryTimeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    string? entryTimeString = entryTimeElement.GetString();
                    if (!string.IsNullOrEmpty(entryTimeString))
                    {
                        visitRecord.EntryTime = DateTime.Parse(entryTimeString);
                    }
                    // No marcar HasEntered todavía, ya que es una entrada programada
                }

                // Manejar propósito de la visita
                if (data.TryGetProperty("visitPurpose", out var visitPurposeElement) &&
                    !visitPurposeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.VisitPurpose = visitPurposeElement.GetString();
                }

                // Procesar la hora estimada de salida
                if (data.TryGetProperty("exitTime", out var exitTimeElement) && 
                    !exitTimeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    string? exitTimeString = exitTimeElement.GetString();
                    if (!string.IsNullOrEmpty(exitTimeString))
                    {
                        visitRecord.ExitTime = DateTime.Parse(exitTimeString);
                    }
                }

                // Asignar empleado autorizado
                if (data.TryGetProperty("authorizedEmployeeId", out var employeeElement) && 
                    !employeeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.AuthorizedEmployeeId = employeeElement.GetInt32();
                }

                // Asignar ubicación
                if (data.TryGetProperty("locationId", out var locationElement) && 
                    !locationElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.LocationId = locationElement.GetInt32();
                }

                // Convertir foto base64 a byte[] si existe
                if (data.TryGetProperty("photoBase64", out var photoElement) && 
                    !photoElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    var base64String = photoElement.GetString();
                    if (!string.IsNullOrEmpty(base64String))
                    {
                        // Quitar prefijo "data:image/..." si existe
                        if (base64String.Contains(","))
                        {
                            base64String = base64String.Split(',')[1];
                        }
                        visitRecord.Photo = Convert.FromBase64String(base64String);
                    }
                }

                await _context.VisitRecords.AddAsync(visitRecord);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Registro de visita creado correctamente", data = visitRecord.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /VisitRecord/Update
        [HttpPost]
        public async Task<IActionResult> Update([FromBody] JsonElement data)
        {
            try
            {
                int id = data.GetProperty("id").GetInt32();
                var visitRecord = await _context.VisitRecords.FindAsync(id);

                if (visitRecord == null)
                {
                    return NotFound(new { success = false, message = "Registro de visita no encontrado" });
                }

                // Actualizar la información del registro
                visitRecord.VisitorId = data.GetProperty("visitorId").GetInt32();
                
                // Actualizar objetos portados
                if (data.TryGetProperty("carriedObjects", out var carriedObjectsElement) && 
                    !carriedObjectsElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.CarriedObjects = carriedObjectsElement.GetString();
                }
                else
                {
                    visitRecord.CarriedObjects = null;
                }

                // Actualizar empleado autorizado
                if (data.TryGetProperty("authorizedEmployeeId", out var employeeElement) && 
                    !employeeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.AuthorizedEmployeeId = employeeElement.GetInt32();
                }
                else
                {
                    visitRecord.AuthorizedEmployeeId = null;
                }

                // Actualizar ubicación
                if (data.TryGetProperty("locationId", out var locationElement) && 
                    !locationElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.LocationId = locationElement.GetInt32();
                }
                else
                {
                    visitRecord.LocationId = null;
                }

                // Actualizar propósito de la visita
                if (data.TryGetProperty("visitPurpose", out var visitPurposeElement) && 
                    !visitPurposeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.VisitPurpose = visitPurposeElement.GetString();
                }
                else
                {
                    visitRecord.VisitPurpose = null;
                }

                // Actualizar campos de entrada/salida
                if (data.TryGetProperty("entryTime", out var entryTimeElement) && 
                    !entryTimeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    string? entryTimeString = entryTimeElement.GetString();
                    if (!string.IsNullOrEmpty(entryTimeString))
                    {
                        visitRecord.EntryTime = DateTime.Parse(entryTimeString);
                        visitRecord.HasEntered = true; // Si hay hora de entrada, el visitante entró
                    }
                }

                // Procesar la hora estimada de salida para actualización
                if (data.TryGetProperty("exitTime", out var exitTimeElement) && 
                    !exitTimeElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    string? exitTimeString = exitTimeElement.GetString();
                    if (!string.IsNullOrEmpty(exitTimeString))
                    {
                        visitRecord.ExitTime = DateTime.Parse(exitTimeString);
                        // No marcamos HasExited como true porque es sólo una hora estimada de salida
                    }
                }

                if (data.TryGetProperty("hasEntered", out var enteredElement) && 
                    !enteredElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.HasEntered = enteredElement.GetBoolean();
                }
                
                if (data.TryGetProperty("hasExited", out var exitedElement) && 
                    !exitedElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.HasExited = exitedElement.GetBoolean();
                }
                
                if (data.TryGetProperty("reportFlag", out var reportElement) && 
                    !reportElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    visitRecord.ReportFlag = reportElement.GetBoolean();
                }

                // Actualizar foto si se proporciona una nueva
                if (data.TryGetProperty("photoBase64", out var photoElement) && 
                    !photoElement.ValueKind.Equals(JsonValueKind.Null))
                {
                    var base64String = photoElement.GetString();
                    if (!string.IsNullOrEmpty(base64String))
                    {
                        // Quitar prefijo "data:image/..." si existe
                        if (base64String.Contains(","))
                        {
                            base64String = base64String.Split(',')[1];
                        }
                        visitRecord.Photo = Convert.FromBase64String(base64String);
                    }
                }

                _context.VisitRecords.Update(visitRecord);
                await _context.SaveChangesAsync();
                
                return Json(new { success = true, message = "Registro de visita actualizado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /VisitRecord/RegisterEntry/5
        [HttpPost]
        public async Task<IActionResult> RegisterEntry(int id)
        {
            try
            {
                var visitRecord = await _context.VisitRecords.FindAsync(id);
                if (visitRecord == null)
                {
                    return NotFound(new { success = false, message = "Registro de visita no encontrado" });
                }

                // Registrar la entrada
                visitRecord.EntryTime = DateTime.Now;
                visitRecord.HasEntered = true; // Marcar que el visitante ha entrado

                _context.VisitRecords.Update(visitRecord);
                await _context.SaveChangesAsync();
                
                return Json(new { success = true, message = "Entrada registrada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /VisitRecord/RegisterExit/5
        [HttpPost]
        public async Task<IActionResult> RegisterExit(int id)
        {
            try
            {
                var visitRecord = await _context.VisitRecords.FindAsync(id);
                if (visitRecord == null)
                {
                    return NotFound(new { success = false, message = "Registro de visita no encontrado" });
                }

                if (!visitRecord.HasEntered)
                {
                    return BadRequest(new { success = false, message = "No se puede registrar la salida sin haber registrado la entrada" });
                }

                // Registrar la salida
                visitRecord.ExitTime = DateTime.Now;
                visitRecord.HasExited = true;

                _context.VisitRecords.Update(visitRecord);
                await _context.SaveChangesAsync();
                
                return Json(new { success = true, message = "Salida registrada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /VisitRecord/ToggleReport/5
        [HttpPost]
        public async Task<IActionResult> ToggleReport(int id)
        {
            try
            {
                var visitRecord = await _context.VisitRecords.FindAsync(id);
                if (visitRecord == null)
                {
                    return NotFound(new { success = false, message = "Registro de visita no encontrado" });
                }

                // Alternar el estado de reporte
                visitRecord.ReportFlag = !visitRecord.ReportFlag;

                _context.VisitRecords.Update(visitRecord);
                await _context.SaveChangesAsync();
                
                string message = visitRecord.ReportFlag 
                    ? "Registro marcado para reporte" 
                    : "Marca de reporte eliminada";
                    
                return Json(new { success = true, message = message, reportFlag = visitRecord.ReportFlag });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // DELETE: /VisitRecord/Delete/5
        [HttpDelete]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var visitRecord = await _context.VisitRecords.FindAsync(id);
                if (visitRecord == null)
                {
                    return NotFound(new { success = false, message = "Registro de visita no encontrado" });
                }

                _context.VisitRecords.Remove(visitRecord);
                await _context.SaveChangesAsync();
                
                return Json(new { success = true, message = "Registro de visita eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}