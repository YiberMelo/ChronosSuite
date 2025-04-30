using ChronosSuite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ChronosSuite.Controllers
{
    public class EmployeeController : Controller
    {
        private readonly PgDbContext _context;

        public EmployeeController(PgDbContext context)
        {
            _context = context;
        }

        // GET: /Employee
        public IActionResult Index()
        {
            return View();
        }

        // GET: /Employee/GetData
        [HttpGet]
        public async Task<IActionResult> GetData()
        {
            try
            {
                var employees = await _context.Employees.ToListAsync();
                return Json(employees);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /Employee/Create
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Employee employee)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    _context.Add(employee);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, data = employee });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { success = false, message = ex.Message });
                }
            }
            return BadRequest(new { success = false, message = "Datos inválidos" });
        }

        // PUT: /Employee/Edit
        [HttpPut]
        public async Task<IActionResult> Edit([FromBody] Employee employee)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(employee);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { success = false, message = ex.Message });
                }
            }
            return BadRequest(new { success = false, message = "Datos inválidos" });
        }

        // DELETE: /Employee/Delete/5
        [HttpDelete]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound(new { success = false, message = "Empleado no encontrado" });
                }

                _context.Employees.Remove(employee);
                await _context.SaveChangesAsync();
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}