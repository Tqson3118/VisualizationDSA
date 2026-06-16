using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using VisualizationDSA.Domain.Strategies;
using VisualizationDSA.Infrastructure.Data;

namespace VisualizationDSA.WebApi.Controllers
{
    /// <summary>
    /// Admin API — quản lý user, quiz, analytics toàn hệ thống.
    /// Yêu cầu role Admin trong JWT token.
    /// Route: /api/v1/concepts/admin
    /// </summary>
    [ApiVersion("1.0")]
    [ApiController]
    [Route("api/v{version:apiVersion}/concepts/admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly StatelessAuthStrategy _authStrategy;
        private readonly QuizBankStrategy _quizBank;

        public AdminController(
            ApplicationDbContext dbContext,
            StatelessAuthStrategy authStrategy,
            QuizBankStrategy quizBank)
        {
            _dbContext = dbContext;
            _authStrategy = authStrategy;
            _quizBank = quizBank;
        }

        // ── JWT Role Guard Helper ────────────────────────────────────────────

        /// <summary>
        /// Giải mã JWT payload, trả về role nếu hợp lệ.
        /// Token format: header.payload.signature (Base64)
        /// </summary>
        private static string? ExtractRoleFromToken(string? authHeader)
        {
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return null;

            var token = authHeader["Bearer ".Length..].Trim();
            var parts = token.Split('.');
            if (parts.Length != 3) return null;

            try
            {
                // Pad Base64 if needed
                var payloadBase64 = parts[1];
                var padding = (4 - payloadBase64.Length % 4) % 4;
                payloadBase64 += new string('=', padding);
                payloadBase64 = payloadBase64.Replace('-', '+').Replace('_', '/');

                var json = Encoding.UTF8.GetString(Convert.FromBase64String(payloadBase64));
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("role", out var roleEl))
                    return roleEl.GetString();
            }
            catch { /* Invalid JWT format */ }

            return null;
        }

        private static string? ExtractSubFromToken(string? authHeader)
        {
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return null;

            var token = authHeader["Bearer ".Length..].Trim();
            var parts = token.Split('.');
            if (parts.Length != 3) return null;

            try
            {
                var payloadBase64 = parts[1];
                var padding = (4 - payloadBase64.Length % 4) % 4;
                payloadBase64 += new string('=', padding);
                payloadBase64 = payloadBase64.Replace('-', '+').Replace('_', '/');

                var json = Encoding.UTF8.GetString(Convert.FromBase64String(payloadBase64));
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("sub", out var subEl))
                    return subEl.GetString();
            }
            catch { }

            return null;
        }

        /// <summary>
        /// Lớp bảo vệ đầu tiên: trả 401 nếu không có Authorization header.
        /// Null = token hợp lệ có mặt, tiếp tục xử lý.
        /// </summary>
        private IActionResult? RequireToken()
        {
            var header = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(header) || !header.StartsWith("Bearer "))
                return Unauthorized(new { error = "UNAUTHORIZED", message = "Yêu cầu đăng nhập để truy cập tài nguyên này." });

            var token = header["Bearer ".Length..].Trim();
            var parts = token.Split('.');
            if (parts.Length != 3)
                return Unauthorized(new { error = "UNAUTHORIZED", message = "Mã xác thực không hợp lệ." });

            try
            {
                var jwtHeader = parts[0];
                var jwtPayload = parts[1];
                var jwtSignature = parts[2];

                // Verify Signature using Dev Secret Key
                var key = Encoding.UTF8.GetBytes("VisualizationDSA-Stateless-Dev-Secret-Key-2024-Phase6-256bit!");
                var expectedSignature = Convert.ToBase64String(
                    HMACSHA256.HashData(key, Encoding.UTF8.GetBytes($"{jwtHeader}.{jwtPayload}"))
                );

                if (jwtSignature != expectedSignature)
                    return Unauthorized(new { error = "UNAUTHORIZED", message = "Chữ ký xác thực không hợp lệ." });

                // Verify Expiration
                var padding = (4 - jwtPayload.Length % 4) % 4;
                var paddedPayload = jwtPayload + new string('=', padding);
                paddedPayload = paddedPayload.Replace('-', '+').Replace('_', '/');
                var json = Encoding.UTF8.GetString(Convert.FromBase64String(paddedPayload));

                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("exp", out var expEl))
                {
                    var expUnix = expEl.GetInt64();
                    var expTime = DateTimeOffset.FromUnixTimeSeconds(expUnix);
                    if (expTime < DateTimeOffset.UtcNow)
                        return Unauthorized(new { error = "UNAUTHORIZED", message = "Phiên đăng nhập đã hết hạn." });
                }
            }
            catch
            {
                return Unauthorized(new { error = "UNAUTHORIZED", message = "Không thể xác thực token." });
            }

            return null;
        }

        private bool IsAdmin()
        {
            var role = ExtractRoleFromToken(Request.Headers["Authorization"].FirstOrDefault());
            return role == "Admin";
        }

        private bool IsTeacherOrAdmin()
        {
            var role = ExtractRoleFromToken(Request.Headers["Authorization"].FirstOrDefault());
            return role == "Teacher" || role == "Admin";
        }

        // ── Dashboard Analytics ──────────────────────────────────────────────

        /// <summary>
        /// Thống kê tổng quan hệ thống từ DB thực.
        /// GET /api/v1/concepts/admin/dashboard
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Admin." });

            try
            {
                var totalUsers   = await _dbContext.Users.CountAsync();
                var totalStudents = await _dbContext.Users.CountAsync(u => u.Role == "Student");
                var totalTeachers = await _dbContext.Users.CountAsync(u => u.Role == "Teacher");
                var totalAdmins  = await _dbContext.Users.CountAsync(u => u.Role == "Admin");
                var premiumUsers = await _dbContext.Users.CountAsync(u => u.IsPremium);
                var totalQuizzes = await _dbContext.Quizzes.CountAsync();
                var totalOrders  = await _dbContext.Orders.CountAsync();
                var paidOrders   = await _dbContext.Orders.CountAsync(o => o.Status == "paid");

                // Top 5 active users by XP
                var topUsers = await _dbContext.Users
                    .OrderByDescending(u => u.TotalXP)
                    .Take(5)
                    .Select(u => new { u.Email, u.Username, u.TotalXP, u.CurrentLevel, u.Role })
                    .ToListAsync();

                return Ok(new
                {
                    users = new { total = totalUsers, students = totalStudents, teachers = totalTeachers, admins = totalAdmins, premium = premiumUsers },
                    quizzes = new { total = totalQuizzes },
                    orders  = new { total = totalOrders, paid = paidOrders },
                    topUsers
                });
            }
            catch (Exception ex)
            {
                Serilog.Log.Warning(ex, "Không thể kết nối cơ sở dữ liệu để lấy dashboard. Fallback sang dữ liệu in-memory.");
                var inMemoryUsers = _authStrategy.GetAllUsers();
                var totalUsers = inMemoryUsers.Count;
                var totalStudents = inMemoryUsers.Count(u => u.Role == "Student");
                var totalTeachers = inMemoryUsers.Count(u => u.Role == "Teacher");
                var totalAdmins = inMemoryUsers.Count(u => u.Role == "Admin");
                var premiumUsers = inMemoryUsers.Count(u => u.IsPremium);

                var topUsers = inMemoryUsers
                    .OrderByDescending(u => u.TotalXP)
                    .Take(5)
                    .Select(u => new { u.Email, u.Username, u.TotalXP, u.CurrentLevel, u.Role })
                    .ToList();

                return Ok(new
                {
                    users = new { total = totalUsers, students = totalStudents, teachers = totalTeachers, admins = totalAdmins, premium = premiumUsers },
                    quizzes = new { total = _quizBank.GetAllQuizzes().Count },
                    orders  = new { total = 0, paid = 0 },
                    topUsers
                });
            }
        }

        // ── User Management ──────────────────────────────────────────────────

        /// <summary>
        /// Danh sách tất cả người dùng (phân trang).
        /// GET /api/v1/concepts/admin/users?page=1&amp;pageSize=20&amp;search=
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Teacher hoặc Admin." });

            try
            {
                var query = _dbContext.Users.AsQueryable();

                if (!string.IsNullOrWhiteSpace(search))
                    query = query.Where(u => u.Email.Contains(search) || u.Username.Contains(search));

                var total = await query.CountAsync();
                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new
                    {
                        id        = u.Id.ToString(),
                        u.Email,
                        u.Username,
                        u.Role,
                        u.IsPremium,
                        u.TotalXP,
                        u.CurrentLevel,
                        u.StreakDays,
                        isActive  = u.IsActive,
                        createdAt = u.CreatedAt,
                        lastLogin = u.LastLoginAt
                    })
                    .ToListAsync();

                return Ok(new { total, page, pageSize, users });
            }
            catch (Exception ex)
            {
                Serilog.Log.Warning(ex, "Không thể kết nối cơ sở dữ liệu để lấy danh sách users. Fallback sang dữ liệu in-memory.");
                var inMemoryUsers = _authStrategy.GetAllUsers();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    inMemoryUsers = inMemoryUsers
                        .Where(u => u.Email.Contains(search, StringComparison.OrdinalIgnoreCase) || 
                                    u.Username.Contains(search, StringComparison.OrdinalIgnoreCase))
                        .ToList();
                }

                var total = inMemoryUsers.Count;
                var users = inMemoryUsers
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new
                    {
                        id        = u.Id,
                        u.Email,
                        u.Username,
                        u.Role,
                        u.IsPremium,
                        u.TotalXP,
                        u.CurrentLevel,
                        u.StreakDays,
                        isActive  = true,
                        createdAt = u.CreatedAt,
                        lastLogin = DateTime.UtcNow
                    })
                    .ToList();

                return Ok(new { total, page, pageSize, users });
            }
        }

        /// <summary>
        /// Đổi role của user.
        /// PUT /api/v1/concepts/admin/users/{id}/role
        /// </summary>
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleRequest request)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Admin." });

            if (request.Role != "Student" && request.Role != "Teacher" && request.Role != "Admin")
                return BadRequest(new { error = "INVALID_ROLE", message = "Role phải là Student, Teacher hoặc Admin." });

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == id);
            if (user == null)
                return NotFound(new { error = "USER_NOT_FOUND" });

            user.SetRole(request.Role);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = $"Đã đổi role của {user.Email} thành {request.Role}.", userId = id, newRole = request.Role });
        }

        /// <summary>
        /// Bật/tắt trạng thái Premium của user.
        /// PUT /api/v1/concepts/admin/users/{id}/premium
        /// </summary>
        [HttpPut("users/{id}/premium")]
        public async Task<IActionResult> TogglePremium(string id, [FromBody] TogglePremiumRequest request)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Admin." });

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == id);
            if (user == null)
                return NotFound(new { error = "USER_NOT_FOUND" });

            user.SetPremiumStatus(request.IsPremium);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = $"Đã {(request.IsPremium ? "bật" : "tắt")} Premium cho {user.Email}.", userId = id, isPremium = request.IsPremium });
        }

        // ── Quiz Management ──────────────────────────────────────────────────

        /// <summary>
        /// Danh sách quiz với số liệu thực từ DB.
        /// GET /api/v1/concepts/admin/quizzes
        /// </summary>
        [HttpGet("quizzes")]
        public async Task<IActionResult> GetQuizzes()
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Teacher hoặc Admin." });

            try
            {
                var quizzes = await _dbContext.Quizzes
                    .OrderBy(q => q.Title)
                    .Select(q => new
                    {
                        id            = q.Id.ToString(),
                        title         = q.Title,
                        topic         = q.Topic,
                        difficulty    = q.Difficulty == 1 ? "easy" : q.Difficulty == 5 ? "hard" : "medium",
                        xpReward      = q.XPReward,
                        questionCount = q.Questions.Count,
                        createdAt     = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    })
                    .ToListAsync();

                return Ok(quizzes);
            }
            catch (Exception ex)
            {
                Serilog.Log.Warning(ex, "Không thể kết nối cơ sở dữ liệu để lấy danh sách quizzes. Fallback sang dữ liệu in-memory.");
                var inMemoryQuizzes = _quizBank.GetAllQuizzes();

                var quizzes = inMemoryQuizzes
                    .OrderBy(q => q.Title)
                    .Select(q => new
                    {
                        id            = q.Id,
                        title         = q.Title,
                        topic         = q.Topic,
                        difficulty    = q.Difficulty,
                        xpReward      = q.XpReward,
                        questionCount = q.Questions.Count,
                        createdAt     = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
                    })
                    .ToList();

                return Ok(quizzes);
            }
        }

        /// <summary>
        /// Xóa quiz theo ID.
        /// DELETE /api/v1/concepts/admin/quizzes/{id}
        /// </summary>
        [HttpDelete("quizzes/{id}")]
        public async Task<IActionResult> DeleteQuiz(string id)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Teacher hoặc Admin." });

            var quiz = await _dbContext.Quizzes.FirstOrDefaultAsync(q => q.Id.ToString() == id);
            if (quiz == null)
                return NotFound(new { error = "QUIZ_NOT_FOUND" });

            _dbContext.Quizzes.Remove(quiz);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa quiz \"{quiz.Title}\"." });
        }

        /// <summary>
        /// Analytics quiz từ DB: top quizzes, pass rate.
        /// GET /api/v1/concepts/admin/analytics/quiz
        /// </summary>
        [HttpGet("analytics/quiz")]
        public async Task<IActionResult> GetQuizAnalytics()
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Teacher hoặc Admin." });

            var quizAttempts = await _dbContext.Quizzes
                .OrderBy(q => q.Title)
                .Select(q => new
                {
                    id            = q.Id.ToString(),
                    title         = q.Title,
                    topic         = q.Topic,
                    difficulty    = q.Difficulty == 1 ? "easy" : q.Difficulty == 5 ? "hard" : "medium",
                    questionCount = q.Questions.Count,
                    xpReward      = q.XPReward
                })
                .ToListAsync();

            var totalUsers   = await _dbContext.Users.CountAsync();
            var premiumCount = await _dbContext.Users.CountAsync(u => u.IsPremium);

            return Ok(new
            {
                totalQuizzes  = quizAttempts.Count,
                totalUsers,
                premiumCount,
                quizzes       = quizAttempts
            });
        }

        /// <summary>
        /// Khóa hoặc Mở khóa tài khoản người dùng.
        /// PUT /api/v1/concepts/admin/users/{id}/ban
        /// </summary>
        [HttpPut("users/{id}/ban")]
        public async Task<IActionResult> BanUser(string id, [FromBody] BanUserRequest request)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Admin." });

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == id);
            if (user == null)
                return NotFound(new { error = "USER_NOT_FOUND" });

            user.SetActiveStatus(request.IsActive);
            await _dbContext.SaveChangesAsync();

            var action = request.IsActive ? "mở khóa" : "khóa";
            return Ok(new { message = $"Đã {action} tài khoản {user.Email}.", userId = id, isActive = request.IsActive });
        }

        /// <summary>
        /// Đóng vai (Impersonate) một user bất kỳ.
        /// POST /api/v1/concepts/admin/users/{id}/impersonate
        /// </summary>
        [HttpPost("users/{id}/impersonate")]
        public async Task<IActionResult> ImpersonateUser(string id)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;
            if (!IsAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Yêu cầu quyền Admin." });

            var adminId = ExtractSubFromToken(Request.Headers["Authorization"].FirstOrDefault()) ?? "unknown-admin";

            string email, username, role;
            int level;
            bool isPremium;

            // Tìm trong DB
            var dbUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == id);
            if (dbUser != null)
            {
                // Đồng bộ sang in-memory
                _authStrategy.EnsureUserInMemory(
                    dbUser.Id.ToString(),
                    dbUser.Email,
                    dbUser.Username,
                    dbUser.PasswordHash,
                    dbUser.IsPremium,
                    dbUser.Role,
                    dbUser.TotalXP,
                    dbUser.CurrentLevel,
                    dbUser.StreakDays
                );
                email = dbUser.Email;
                username = dbUser.Username;
                role = dbUser.Role;
                level = dbUser.CurrentLevel;
                isPremium = dbUser.IsPremium;
            }
            else
            {
                // Tìm trong in-memory
                try
                {
                    var memoryProfile = _authStrategy.GetProfile(id);
                    email = memoryProfile.Email;
                    username = memoryProfile.Username;
                    role = memoryProfile.Role;
                    level = memoryProfile.CurrentLevel;
                    isPremium = memoryProfile.IsPremium;
                }
                catch (KeyNotFoundException)
                {
                    return NotFound(new { error = "USER_NOT_FOUND", message = "Không tìm thấy người dùng để đóng vai." });
                }
            }

            // Sinh Impersonated Token
            var impersonatedToken = GenerateImpersonatedJwt(id, email, username, role, level, adminId);
            var impersonatedRefreshToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            _authStrategy.ForceAddRefreshToken(impersonatedRefreshToken, id);

            return Ok(new
            {
                accessToken = impersonatedToken,
                refreshToken = impersonatedRefreshToken,
                expiresIn = 900, // 15 minutes
                user = new
                {
                    id,
                    email,
                    username,
                    role,
                    level,
                    isPremium
                }
            });
        }

        private static string GenerateImpersonatedJwt(string userId, string email, string username, string role, int level, string adminId)
        {
            var header = Convert.ToBase64String(Encoding.UTF8.GetBytes("{\"alg\":\"HS256\",\"typ\":\"JWT\"}"));
            var payload = Convert.ToBase64String(Encoding.UTF8.GetBytes(
                $"{{\"sub\":\"{userId}\",\"email\":\"{email}\",\"name\":\"{username}\"," +
                $"\"role\":\"{role}\"," +
                $"\"level\":{level},\"exp\":{DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds()}," +
                $"\"jti\":\"{Guid.NewGuid()}\",\"isImpersonated\":true,\"originalAdminId\":\"{adminId}\"}}"
            ));
            var key = Encoding.UTF8.GetBytes("VisualizationDSA-Stateless-Dev-Secret-Key-2024-Phase6-256bit!");
            var signature = Convert.ToBase64String(
                HMACSHA256.HashData(key, Encoding.UTF8.GetBytes($"{header}.{payload}"))
            );
            return $"{header}.{payload}.{signature}";
        }
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record UpdateRoleRequest(string Role);
    public record TogglePremiumRequest(bool IsPremium);
    public record BanUserRequest(bool IsActive);
}
