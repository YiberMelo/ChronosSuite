using ChronosSuite.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ChronosSuite.Controllers
{
    public class CompanyController : Controller
    {
        private readonly PgDbContext _context;

        public CompanyController(PgDbContext context)
        {
            _context = context;
        }

        // GET: /Company
        public IActionResult Index()
        {
            return View();
        }

        // GET: /Company/GetData
        [HttpGet]
        public async Task<IActionResult> GetData()
        {
            try
            {
                var companies = await _context.Companies.ToListAsync();
                return Json(companies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // POST: /Company/Create
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Company company)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    _context.Add(company);
                    await _context.SaveChangesAsync();
                    return Json(new { success = true, data = company });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { success = false, message = ex.Message });
                }
            }
            return BadRequest(new { success = false, message = "Datos inválidos" });
        }

        // PUT: /Company/Edit
        [HttpPut]
        public async Task<IActionResult> Edit([FromBody] Company company)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(company);
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

        // DELETE: /Company/Delete/5
        [HttpDelete]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var company = await _context.Companies.FindAsync(id);
                if (company == null)
                {
                    return NotFound(new { success = false, message = "Empresa no encontrada" });
                }

                _context.Companies.Remove(company);
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