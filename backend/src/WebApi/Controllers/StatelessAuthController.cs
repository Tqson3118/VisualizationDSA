using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using VisualizationDSA.Domain.Engine;
using VisualizationDSA.Domain.Strategies;

namespace VisualizationDSA.WebApi.Controllers
{
    /// <summary>
    /// Stateless Auth Controller — xử lý đăng ký, đăng nhập, profile mà KHÔNG cần PostgreSQL.
    /// Dùng in-memory user store cho demo và development.
    /// Route: api/v{version:apiVersion}/concepts/auth
    /// </summary>
    [ApiVersion("1.0")]
    [ApiController]
    [Route("api/v{version:apiVersion}/concepts/auth")]
    public class StatelessAuthController : ControllerBase
    {
        private readonly StatelessAuthStrategy _authStrategy;

        public StatelessAuthController(StatelessAuthStrategy authStrategy)
        {
            _authStrategy = authStrategy;
        }

        /// <summary>
        /// Đăng ký tài khoản mới (in-memory).
        /// POST /api/v1/concepts/auth/register
        /// </summary>
        [HttpPost("register")]
        public ActionResult<StatelessAuthResponse> Register([FromBody] StatelessRegisterRequest request)
        {
            try
            {
                var response = _authStrategy.Register(request);
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = "REGISTRATION_FAILED", message = ex.Message });
            }
        }

        /// <summary>
        /// Đăng nhập và nhận mock Access Token + Refresh Token.
        /// POST /api/v1/concepts/auth/login
        /// </summary>
        [HttpPost("login")]
        public ActionResult<StatelessAuthResponse> Login([FromBody] StatelessLoginRequest request)
        {
            try
            {
                var response = _authStrategy.Login(request);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = "LOGIN_FAILED", message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy Access Token mới từ Refresh Token.
        /// POST /api/v1/concepts/auth/refresh
        /// </summary>
        [HttpPost("refresh")]
        public ActionResult<StatelessAuthResponse> Refresh([FromBody] StatelessRefreshRequest request)
        {
            try
            {
                var response = _authStrategy.RefreshToken(request.RefreshToken);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = "REFRESH_FAILED", message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "USER_NOT_FOUND", message = ex.Message });
            }
        }

        /// <summary>
        /// Đăng xuất — thu hồi Refresh Token khỏi bộ nhớ.
        /// POST /api/v1/concepts/auth/logout
        /// </summary>
        [HttpPost("logout")]
        public IActionResult Logout([FromBody] StatelessRefreshRequest request)
        {
            _authStrategy.Logout(request.RefreshToken);
            return NoContent();
        }

        /// <summary>
        /// Lấy thông tin profile từ userId.
        /// GET /api/v1/concepts/auth/me?userId=...
        /// </summary>
        [HttpGet("me")]
        public ActionResult<StatelessUserDto> GetMe([FromQuery] string? userId)
        {
            try
            {
                var id = userId ?? "demo-user-001";
                var user = _authStrategy.GetProfile(id);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "USER_NOT_FOUND", message = ex.Message });
            }
        }

        /// <summary>
        /// Lấy tiến trình học tập của user.
        /// GET /api/v1/concepts/auth/progress?userId=...
        /// </summary>
        [HttpGet("progress")]
        public ActionResult<StatelessUserProgressDto> GetProgress([FromQuery] string? userId)
        {
            try
            {
                var id = userId ?? "demo-user-001";
                var progress = _authStrategy.GetUserProgress(id);
                return Ok(progress);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "USER_NOT_FOUND", message = ex.Message });
            }
        }

        /// <summary>
        /// Cập nhật profile (username).
        /// PUT /api/v1/concepts/auth/profile
        /// </summary>
        [HttpPut("profile")]
        public ActionResult<StatelessUserDto> UpdateProfile([FromBody] StatelessUpdateProfileRequest request)
        {
            try
            {
                var id = request.UserId ?? "demo-user-001";
                var user = _authStrategy.UpdateProfile(id, request.Username);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "USER_NOT_FOUND", message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = "UPDATE_FAILED", message = ex.Message });
            }
        }

        /// <summary>
        /// Cộng XP cho user.
        /// POST /api/v1/concepts/auth/award-xp
        /// </summary>
        [HttpPost("award-xp")]
        public ActionResult<StatelessUserDto> AwardXP([FromBody] StatelessXpAwardRequest request)
        {
            try
            {
                var id = request.UserId ?? "demo-user-001";
                var user = _authStrategy.AwardXP(id, request.Amount, request.Reason);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "USER_NOT_FOUND", message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = "INVALID_AMOUNT", message = ex.Message });
            }
        }

        /// <summary>
        /// Demo credentials info.
        /// GET /api/v1/concepts/auth/demo-credentials
        /// </summary>
        [HttpGet("demo-credentials")]
        public ActionResult<object> GetDemoCredentials()
        {
            return Ok(new
            {
                message = "Tài khoản demo để kiểm thử",
                email = "demo@algolens.dev",
                password = "Demo@2024",
                note = "Đây là tài khoản in-memory, dữ liệu sẽ reset khi khởi động lại server."
            });
        }
    }
}
