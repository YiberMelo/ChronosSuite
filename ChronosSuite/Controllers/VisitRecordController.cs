using ChronosSuite.Models;
using ChronosSuite.Models.Dto.Visitor;
using ChronosSuite.Models.Dto.VisitRecord;
using DannteV2.Models.Dto.FiltersTable;
using ImageMagick;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using OntimerSuite.Tools;

namespace ChronosSuite.Controllers
{
    public class VisitRecordController : Controller
    {
        private readonly PgDbContext _context;

        public VisitRecordController(PgDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            ViewBag.VisitRecord = "active";
            return View();
        }

        [HttpPost]
        public IActionResult GetAll([FromBody] TableRequest<FilterVisitRecord>? request)
        {

            try
            {
                if (request == null || request.filter == null)
                    return Json(new { success = false, message = "Solicitud inválida." });

                var query = _context.VisitRecords
                                     .Include(v => v.AuthorizedEmployee)
                                     .Include(v => v.Location)
                                     .Include(v => v.User)
                                     .Include(v => v.Visitor)
                                     .AsQueryable();


                if (request.filter.HasExited)
                    query = query.Where(vr => vr.HasExited);

                if (request.filter.HasEntered)
                    query = query.Where(vr => vr.HasEntered);

                if (request.filter.ReportFlag)
                    query = query.Where(vr => vr.ReportFlag);

                if (request.filter.IsImmediateVisit)
                    query = query.Where(vr => vr.IsImmediateVisit);

                if (!string.IsNullOrEmpty(request.filter.CarriedObjects))
                    query = query.Where(vr => vr.CarriedObjects.Contains(request.filter.CarriedObjects));

                if (!string.IsNullOrEmpty(request.filter.VisitPurpose))
                    query = query.Where(vr => vr.VisitPurpose.Contains(request.filter.VisitPurpose));


                if (!string.IsNullOrEmpty(request.filter.EntryTime))
                {
                    if (DateTime.TryParse(request.filter.EntryTime, out DateTime entryTimeParsed))
                    {
                        query = query.Where(vr => vr.EntryTime.HasValue && vr.EntryTime.Value.Date == entryTimeParsed.Date);
                    }
                }

                if (!string.IsNullOrEmpty(request.filter.ExitTime))
                {
                    if (DateTime.TryParse(request.filter.ExitTime, out DateTime exitTimeParsed))
                    {
                        query = query.Where(vr => vr.ExitTime.HasValue && vr.ExitTime.Value.Date == exitTimeParsed.Date);
                    }
                }

                if (!string.IsNullOrEmpty(request.filter.VisitorFullName))
                {
                    query = query.Where(vr =>
                        (vr.Visitor.FirstName + " " + vr.Visitor.LastName).ToLower().Contains(request.filter.VisitorFullName.ToLower()));
                }

                if (!string.IsNullOrEmpty(request.filter.AuthorizedEmployeeFullName))
                {
                    query = query.Where(vr =>
                        (vr.AuthorizedEmployee.FirstName + " " + vr.AuthorizedEmployee.LastName).ToLower().Contains(request.filter.AuthorizedEmployeeFullName.ToLower()));
                }

                if (!string.IsNullOrEmpty(request.filter.LocationName))
                {
                    query = query.Where(vr => vr.Location != null && vr.Location.Name.Contains(request.filter.LocationName));
                }

                if (!string.IsNullOrEmpty(request.sort))
                {
                    query = request.order?.ToLower() == "desc"
                        ? request.sort.ToLower() switch
                        {
                            "visitorfullname" => query.OrderByDescending(vr => (vr.Visitor.FirstName + " " + vr.Visitor.LastName)),
                            "authorizedemployeefullname" => query.OrderByDescending(vr => (vr.AuthorizedEmployee.FirstName + " " + vr.AuthorizedEmployee.LastName)),
                            "locationname" => query.OrderByDescending(vr => vr.Location.Name),
                            "carriedobjects" => query.OrderByDescending(vr => vr.CarriedObjects),
                            "visitpurpose" => query.OrderByDescending(vr => vr.VisitPurpose),
                            "reportdescription" => query.OrderByDescending(vr => vr.ReportDescription),
                            "entrytime" => query.OrderByDescending(vr => vr.EntryTime),
                            "exittime" => query.OrderByDescending(vr => vr.ExitTime),
                            _ => query.OrderByDescending(vr => EF.Property<object>(vr, request.sort))
                        }
                        : request.sort.ToLower() switch
                        {
                            "visitorfullname" => query.OrderBy(vr => (vr.Visitor.FirstName + " " + vr.Visitor.LastName)),
                            "authorizedemployeefullname" => query.OrderBy(vr => (vr.AuthorizedEmployee.FirstName + " " + vr.AuthorizedEmployee.LastName)),
                            "locationname" => query.OrderBy(vr => vr.Location.Name),
                            "carriedobjects" => query.OrderBy(vr => vr.CarriedObjects),
                            "visitpurpose" => query.OrderBy(vr => vr.VisitPurpose),
                            "reportdescription" => query.OrderBy(vr => vr.ReportDescription),
                            "entrytime" => query.OrderBy(vr => vr.EntryTime),
                            "exittime" => query.OrderBy(vr => vr.ExitTime),
                            _ => query.OrderBy(vr => EF.Property<object>(vr, request.sort))
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
                                .Select(p => new VisitRecordReadDto
                                {
                                    Id = p.Id,
                                    CarriedObjects = p.CarriedObjects,
                                    EntryTime = p.EntryTime,
                                    ExitTime = p.ExitTime,
                                    HasExited = p.HasExited,
                                    ReportFlag = p.ReportFlag,
                                    HasEntered = p.HasEntered,
                                    VisitPurpose = p.VisitPurpose,
                                    IsImmediateVisit = p.IsImmediateVisit,
                                    CreatedAt = p.CreatedAt,
                                    UpdatedAt = p.UpdatedAt,
                                    VisitorFullName = (p.Visitor.FirstName + " " + p.Visitor.LastName),
                                    AuthorizedEmployeeFullName = (p.AuthorizedEmployee.FirstName + " " + p.AuthorizedEmployee.LastName),
                                    LocationName = p.Location != null ? p.Location.Name : string.Empty
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
                var visit = await _context.VisitRecords
                                         .AsNoTracking()
                                         .FirstOrDefaultAsync(p => p.Id == id);

                if (visit == null)
                {
                    return Json(new { success = false, message = "Registro de la visita no encontrado." });
                }

                var dtoVisit = new VisitRecordReadDto
                {
                    Id = visit.Id,
                    VisitorId = visit.VisitorId,
                    AuthorizedEmployeeId = visit.AuthorizedEmployeeId,
                    LocationId = visit.LocationId,
                    CarriedObjects = visit.CarriedObjects,
                    VisitPurpose = visit.VisitPurpose,
                    EntryTime = visit.EntryTime,
                    ExitTime = visit.ExitTime,
                    ScheduledEntryTime = visit.ScheduledEntryTime,
                    ScheduledExitTime = visit.ScheduledExitTime,
                    IsImmediateVisit = visit.IsImmediateVisit
                };

                return Json(new { success = true, visit = dtoVisit });
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

        [HttpPost]
        public async Task<IActionResult> Save([FromBody] VisitRecordSaveDto model)
        {
            if (model == null)
            {
                return Json(new { success = false, message = "Datos incorrectos" });
            }

            try
            {
                DateTime scheduledEntryTime = DateTime.Parse(model.ScheduledEntryTime);
                DateTime scheduledExitTime = DateTime.Parse(model.ScheduledExitTime);

                DateTime today = DateTime.Today;
                DateTime now = DateTime.Now;

                if (scheduledExitTime <= scheduledEntryTime)
                {
                    return Json(new { success = false, message = "La fecha/hora de salida debe ser mayor que la de entrada." });
                }

                var existingVisit = await _context.VisitRecords
                    .FirstOrDefaultAsync(v => v.VisitorId == model.VisitorId &&
                                              v.EntryTime == scheduledEntryTime &&
                                              v.LocationId == model.LocationId);

                if (existingVisit != null)
                {
                    return Json(new { success = false, message = "Ya existe una visita registrada con los mismos datos." });
                }

                DateTime nowUtc = DateTime.UtcNow;
                DateTime newDate = nowUtc.AddHours(-5);

                newDate = new DateTime(
                    newDate.Year,
                    newDate.Month,
                    newDate.Day,
                    newDate.Hour,
                    newDate.Minute,
                    newDate.Second,
                    DateTimeKind.Unspecified
                );

                var visitRecord = new VisitRecord
                {
                    VisitorId = model.VisitorId,
                    UserId = 1,
                    AuthorizedEmployeeId = model.AuthorizedEmployeeId,
                    LocationId = model.LocationId,
                    CarriedObjects = model.CarriedObjects,
                    VisitPurpose = model.VisitPurpose,
                    IsImmediateVisit = model.IsImmediateVisit,
                    HasEntered = model.IsImmediateVisit,
                    EntryTime = model.IsImmediateVisit ? scheduledEntryTime : null,
                    HasExited = false,
                    ScheduledEntryTime = scheduledEntryTime,
                    ScheduledExitTime = scheduledExitTime,
                    ReportFlag = false,
                    CreatedAt = newDate,
                    UpdatedAt = newDate
                };

                _context.VisitRecords.Add(visitRecord);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Visita guardada exitosamente" });
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

        [HttpPost]
        public async Task<IActionResult> MarkEntry(long visitRecordId)
        {
            try
            {
                var visitRecord = await _context.VisitRecords.FirstOrDefaultAsync(vr => vr.Id == visitRecordId);

                if (visitRecord == null)
                {
                    return Json(new { success = false, message = "Registro de visita no encontrado." });
                }

                if (visitRecord.HasEntered)
                {
                    return Json(new { success = false, message = "El visitante ya ha registrado su entrada." });
                }

                visitRecord.HasEntered = true;
                visitRecord.EntryTime = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day, DateTime.Now.Hour, DateTime.Now.Minute, 0);
                visitRecord.UpdatedAt = DateTime.Now;

                _context.VisitRecords.Update(visitRecord);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Entrada registrada exitosamente." });
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

        [HttpPost]
        public async Task<IActionResult> MarkExit(long visitRecordId)
        {
            try
            {
                var visitRecord = await _context.VisitRecords.FirstOrDefaultAsync(vr => vr.Id == visitRecordId);

                if (visitRecord == null)
                {
                    return Json(new { success = false, message = "Registro de visita no encontrado." });
                }

                if (!visitRecord.HasEntered)
                {
                    return Json(new { success = false, message = "El visitante no ha registrado su entrada." });
                }

                if (visitRecord.HasExited)
                {
                    return Json(new { success = false, message = "El visitante ya ha registrado su salida." });
                }

                visitRecord.HasExited = true;
                visitRecord.ExitTime = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day, DateTime.Now.Hour, DateTime.Now.Minute, 0);
                visitRecord.UpdatedAt = DateTime.Now;

                _context.VisitRecords.Update(visitRecord);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Salida registrada exitosamente." });
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

        [HttpPost]
        public async Task<IActionResult> MarkAsReported(long visitRecordId, string reportDescription)
        {
            try
            {
                var visitRecord = await _context.VisitRecords.FirstOrDefaultAsync(vr => vr.Id == visitRecordId);

                if (visitRecord == null)
                {
                    return Json(new { success = false, message = "Registro de visita no encontrado." });
                }

                if (visitRecord.ReportFlag)
                {
                    return Json(new { success = false, message = "El registro ya ha sido marcado como reportado." });
                }

                visitRecord.ReportFlag = true;
                visitRecord.ReportDescription = reportDescription;
                visitRecord.UpdatedAt = DateTime.Now;

                _context.VisitRecords.Update(visitRecord);
                await _context.SaveChangesAsync();

                return Json(new { success = true, message = "Registro marcado como reportado exitosamente." });
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

        [HttpGet]
        public async Task<IActionResult> GetReportStatus(long visitRecordId)
        {
            var visit = await _context.VisitRecords
                                    .AsNoTracking()
                                    .FirstOrDefaultAsync(v => v.Id == visitRecordId);

            if (visit == null)
                return Json(new { success = false, message = "Registro no encontrado." });

            return Json(new
            {
                success = true,
                reportFlag = visit.ReportFlag,
                reportDescription = visit.ReportDescription
            });
        }


        [HttpDelete]
        public IActionResult Delete(long id)
        {
            try
            {
                if (id <= 0)
                    return Json(new { success = false, message = "Visitante invalido." });

                var visit = _context.VisitRecords.FirstOrDefault(l => l.Id == id);

                if (visit == null)
                    return Json(new { success = false, message = "Registro no encontrado." });

                _context.VisitRecords.Remove(visit);
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