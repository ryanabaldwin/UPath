using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UPath.Api.Data;

namespace UPath.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OKRController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OKRController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public IActionResult GetOKR()
        {
            var studentCount = _context.Users.Count();
            var mentorConnections = _context.Meetings.Count();
            var milestonesCompleted = _context.Milestones.Count();

            var data = new
            {
                objective = "Empower underprivileged youth to explore career paths",
                results = new[]
                {
                    new { label = "Students served", value = studentCount },
                    new { label = "Mentor connections", value = mentorConnections },
                    new { label = "Milestones completed", value = milestonesCompleted }
                }
            };

            return Ok(data);
        }
    }
}