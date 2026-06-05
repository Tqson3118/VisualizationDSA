using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using VisualizationDSA.Domain.Strategies;

namespace VisualizationDSA.WebApi.Controllers
{
    /// <summary>
    /// Stateless Gamification API — XP, badges, leaderboard without database.
    /// Route: /api/v1/concepts/gamification
    /// </summary>
    [ApiVersion("1.0")]
    [ApiController]
    [Route("api/v{version:apiVersion}/concepts/gamification")]
    public class StatelessGamificationController : ControllerBase
    {
        private readonly GamificationStrategy _gamification;

        public StatelessGamificationController(GamificationStrategy gamification)
        {
            _gamification = gamification;
        }

        /// <summary>
        /// Lấy thông tin profile người dùng demo (XP, level, badges, activity).
        /// GET /api/v1/concepts/gamification/profile
        /// </summary>
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            return Ok(_gamification.GetUserProfile());
        }

        /// <summary>
        /// Cộng XP cho người dùng demo.
        /// POST /api/v1/concepts/gamification/award-xp
        /// Body: { "amount": 50, "reason": "Hoàn thành quiz" }
        /// </summary>
        [HttpPost("award-xp")]
        public IActionResult AwardXp([FromBody] AwardXpRequest request)
        {
            if (request.Amount <= 0 || request.Amount > 500)
                return BadRequest(new { error = "INVALID_AMOUNT", message = "XP phải trong khoảng 1-500." });

            var profile = _gamification.AwardXp(request.Amount, request.Reason);
            return Ok(profile);
        }

        /// <summary>
        /// Lấy danh sách tất cả badges (gồm trạng thái đã đạt hay chưa).
        /// GET /api/v1/concepts/gamification/badges
        /// </summary>
        [HttpGet("badges")]
        public IActionResult GetBadges()
        {
            return Ok(_gamification.GetAllBadges());
        }

        /// <summary>
        /// Lấy bảng xếp hạng mock.
        /// GET /api/v1/concepts/gamification/leaderboard?limit=10
        /// </summary>
        [HttpGet("leaderboard")]
        public IActionResult GetLeaderboard([FromQuery] int limit = 10)
        {
            return Ok(_gamification.GetLeaderboard(limit));
        }

        /// <summary>
        /// Lấy cấu hình gamification (level thresholds, badge definitions, XP events).
        /// GET /api/v1/concepts/gamification/config
        /// </summary>
        [HttpGet("config")]
        [ResponseCache(Duration = 86400)]
        public IActionResult GetConfig()
        {
            return Ok(_gamification.GetConfig());
        }
    }

    public class AwardXpRequest
    {
        public int Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
