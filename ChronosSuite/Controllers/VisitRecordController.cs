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

                if (!string.IsNullOrEmpty(request.filter.CarriedObjects))
                    query = query.Where(vr => vr.CarriedObjects.Contains(request.filter.CarriedObjects));

                if (!string.IsNullOrEmpty(request.filter.VisitPurpose))
                    query = query.Where(vr => vr.VisitPurpose.Contains(request.filter.VisitPurpose));

                if (!string.IsNullOrEmpty(request.filter.ReportDescription))
                    query = query.Where(vr => vr.ReportDescription.Contains(request.filter.ReportDescription));

                if (request.filter.HasExited)
                    query = query.Where(vr => vr.HasExited);

                if (request.filter.HasEntered)
                    query = query.Where(vr => vr.HasEntered);

                if (request.filter.ReportFlag)
                    query = query.Where(vr => vr.ReportFlag);

                if (request.filter.IsImmediateVisit)
                    query = query.Where(vr => vr.IsImmediateVisit);

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

                if (!string.IsNullOrEmpty(request.filter.ScheduledEntryTime))
                {
                    if (DateTime.TryParse(request.filter.ScheduledEntryTime, out DateTime scheduledEntryTimeParsed))
                    {
                        query = query.Where(vr => vr.ScheduledEntryTime.Date == scheduledEntryTimeParsed.Date);
                    }
                }

                if (!string.IsNullOrEmpty(request.filter.ScheduledExitTime))
                {
                    if (DateTime.TryParse(request.filter.ScheduledExitTime, out DateTime scheduledExitTimeParsed))
                    {
                        query = query.Where(vr => vr.ScheduledExitTime.Date == scheduledExitTimeParsed.Date);
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
                            "scheduledentrytime" => query.OrderByDescending(vr => vr.ScheduledEntryTime),
                            "scheduledexittime" => query.OrderByDescending(vr => vr.ScheduledExitTime),
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
                            "scheduledentrytime" => query.OrderBy(vr => vr.ScheduledEntryTime),
                            "scheduledexittime" => query.OrderBy(vr => vr.ScheduledExitTime),
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
                                    ReportDescription = p.ReportDescription,
                                    ScheduledEntryTime = p.ScheduledEntryTime,
                                    ScheduledExitTime = p.ScheduledExitTime,
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
                    ScheduledExitTime = visit.ScheduledExitTime
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

                if (scheduledEntryTime <= now)
                {
                    return Json(new { success = false, message = "La fecha/hora de entrada debe ser mayor que la hora actual del día de hoy." });
                }

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

    }
}