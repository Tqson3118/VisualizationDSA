using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Asp.Versioning;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using VisualizationDSA.Domain.Engine;
using VisualizationDSA.Domain.Entities;
using VisualizationDSA.Domain.Strategies;
using VisualizationDSA.Infrastructure.Data;

namespace VisualizationDSA.WebApi.Controllers
{
    /// <summary>
    /// Quiz API — serves quiz bank from in-memory + PostgreSQL persistence.
    /// Route: /api/v1/concepts/quiz
    /// </summary>
    [ApiVersion("1.0")]
    [ApiController]
    [Route("api/v{version:apiVersion}/concepts/quiz")]
    public class StatelessQuizController : ControllerBase
    {
        private readonly QuizBankStrategy _quizBank;
        private readonly ApplicationDbContext _dbContext;

        public StatelessQuizController(QuizBankStrategy quizBank, ApplicationDbContext dbContext)
        {
            _quizBank = quizBank;
            _dbContext = dbContext;
        }

        /// <summary>
        /// Lấy danh sách tất cả quiz trong ngân hàng câu hỏi.
        /// GET /api/v1/concepts/quiz/all
        /// </summary>
        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var quizzes = _quizBank.GetAllQuizzes().Select(q => new
            {
                q.Id, q.Title, q.Topic, q.Difficulty, q.XpReward,
                questionCount = q.Questions.Count
            });
            return Ok(quizzes);
        }

        /// <summary>
        /// Lấy danh sách các chủ đề quiz.
        /// GET /api/v1/concepts/quiz/topics
        /// </summary>
        [HttpGet("topics")]
        public IActionResult GetTopics()
        {
            return Ok(_quizBank.GetTopics());
        }

        /// <summary>
        /// Lấy chi tiết một quiz theo ID (bao gồm câu hỏi + đáp án).
        /// GET /api/v1/concepts/quiz/{quizId}
        /// </summary>
        [HttpGet("{quizId}")]
        public IActionResult GetById(string quizId)
        {
            var quiz = _quizBank.GetQuizById(quizId);
            if (quiz == null)
                return NotFound(new { error = "QUIZ_NOT_FOUND", quizId, supportedQuizzes = _quizBank.GetAllQuizzes().Select(q => q.Id) });
            return Ok(quiz);
        }

        /// <summary>
        /// Lấy quiz theo chủ đề.
        /// GET /api/v1/concepts/quiz/topic/{topic}
        /// </summary>
        [HttpGet("topic/{topic}")]
        public IActionResult GetByTopic(string topic)
        {
            var quizzes = _quizBank.GetQuizzesByTopic(topic);
            return Ok(quizzes);
        }

        /// <summary>
        /// Submit câu trả lời và nhận kết quả chấm điểm. Persist kết quả vào DB.
        /// POST /api/v1/concepts/quiz/submit
        /// </summary>
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitAttempt([FromBody] StatelessQuizAttemptRequest request)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;

            try
            {
                var result = _quizBank.EvaluateAttempt(request);

                // ✅ Persist quiz attempt vào DB — không dùng RAM-only nữa
                var quiz = await _dbContext.Quizzes
                    .FirstOrDefaultAsync(q => q.Title == request.QuizId || q.Id.ToString() == request.QuizId);
                if (quiz != null)
                {
                    // Tìm user theo email từ auth header (nếu có)
                    var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                    var userId = ExtractSubFromToken(authHeader);
                    var user = userId != null
                        ? await _dbContext.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId)
                        : null;

                    if (user != null)
                    {
                        // Award XP nếu pass
                        if (result.Passed && result.XpAwarded > 0)
                        {
                            user.AwardXP(result.XpAwarded);
                            user.RecordActivity();
                            await _dbContext.SaveChangesAsync();
                        }
                    }
                }

                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "QUIZ_NOT_FOUND", message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = "INVALID_ANSWERS", message = ex.Message });
            }
        }

        /// <summary>
        /// Teacher/Admin: thêm quiz mới vào ngân hàng câu hỏi.
        /// Yêu cầu JWT role Teacher hoặc Admin.
        /// POST /api/v1/concepts/quiz/manage
        /// </summary>
        [HttpPost("manage")]
        public async Task<IActionResult> ManageQuiz([FromBody] StatelessQuizDto quiz)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;

            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Chỉ Giảng viên hoặc Admin mới được thêm quiz." });

            if (string.IsNullOrWhiteSpace(quiz.Title) || quiz.Questions.Count == 0)
                return BadRequest(new { error = "INVALID_QUIZ", message = "Quiz phải có tiêu đề và ít nhất 1 câu hỏi." });

            // Chuẩn hóa văn bản chống trùng
            quiz.Title = NormalizeText(quiz.Title);
            foreach (var q in quiz.Questions)
            {
                q.Text = NormalizeText(q.Text);
                for (int i = 0; i < q.Options.Count; i++)
                {
                    q.Options[i] = NormalizeText(q.Options[i]);
                }
                q.Explanation = NormalizeText(q.Explanation);
            }

            // Add to in-memory bank for immediate availability
            var created = _quizBank.AddQuiz(quiz);

            // Persist to PostgreSQL
            var difficultyInt = quiz.Difficulty switch
            {
                "easy" => 1, "medium" => 3, "hard" => 5, _ => 3
            };
            var dbQuiz = new Quiz(quiz.Title, quiz.Topic, quiz.Topic, difficultyInt, quiz.XpReward);
            foreach (var q in quiz.Questions)
            {
                dbQuiz.AddQuestion(q.Text, q.Options.ToArray(), q.CorrectIndex, q.Explanation ?? "");
            }
            _dbContext.Quizzes.Add(dbQuiz);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Quiz đã được thêm thành công.", quiz = created });
        }

        /// <summary>
        /// Teacher/Admin: cập nhật quiz hiện có.
        /// Yêu cầu JWT role Teacher hoặc Admin.
        /// PUT /api/v1/concepts/quiz/manage/{quizId}
        /// </summary>
        [HttpPut("manage/{quizId}")]
        public async Task<IActionResult> UpdateQuiz(string quizId, [FromBody] StatelessQuizDto quiz)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;

            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Chỉ Giảng viên hoặc Admin mới được chỉnh sửa quiz." });

            if (string.IsNullOrWhiteSpace(quiz.Title) || quiz.Questions.Count == 0)
                return BadRequest(new { error = "INVALID_QUIZ", message = "Quiz phải có tiêu đề và ít nhất 1 câu hỏi." });

            // Chuẩn hóa văn bản chống trùng
            quiz.Title = NormalizeText(quiz.Title);
            foreach (var q in quiz.Questions)
            {
                q.Text = NormalizeText(q.Text);
                for (int i = 0; i < q.Options.Count; i++)
                {
                    q.Options[i] = NormalizeText(q.Options[i]);
                }
                q.Explanation = NormalizeText(q.Explanation);
            }

            // Update in-memory bank
            var updated = _quizBank.UpdateQuiz(quizId, quiz);
            if (updated == null)
                return NotFound(new { error = "QUIZ_NOT_FOUND", message = $"Không tìm thấy quiz với ID {quizId} để cập nhật." });

            // Update database
            var dbQuiz = await _dbContext.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Title == quizId || q.Id.ToString() == quizId);
            if (dbQuiz != null)
            {
                var difficultyInt = quiz.Difficulty switch
                {
                    "easy" => 1, "medium" => 3, "hard" => 5, _ => 3
                };
                dbQuiz.Update(quiz.Title, quiz.Topic, quiz.Topic, difficultyInt, quiz.XpReward);
                
                // Clear old questions and add new ones
                dbQuiz.ClearQuestions();
                foreach (var q in quiz.Questions)
                {
                    dbQuiz.AddQuestion(q.Text, q.Options.ToArray(), q.CorrectIndex, q.Explanation ?? "");
                }
                
                await _dbContext.SaveChangesAsync();
            }

            return Ok(new { message = "Quiz đã được cập nhật thành công.", quiz = updated });
        }

        /// <summary>
        /// Teacher/Admin: xóa quiz.
        /// Yêu cầu JWT role Teacher hoặc Admin.
        /// DELETE /api/v1/concepts/quiz/manage/{quizId}
        /// </summary>
        [HttpDelete("manage/{quizId}")]
        public async Task<IActionResult> DeleteQuiz(string quizId)
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;

            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Chỉ Giảng viên hoặc Admin mới được xóa quiz." });

            // Delete in-memory
            var deletedInMemory = _quizBank.DeleteQuiz(quizId);

            // Delete from database
            var dbQuiz = await _dbContext.Quizzes
                .FirstOrDefaultAsync(q => q.Title == quizId || q.Id.ToString() == quizId);
            if (dbQuiz != null)
            {
                _dbContext.Quizzes.Remove(dbQuiz);
                await _dbContext.SaveChangesAsync();
            }

            if (!deletedInMemory && dbQuiz == null)
                return NotFound(new { error = "QUIZ_NOT_FOUND", message = $"Không tìm thấy quiz với ID {quizId} để xóa." });

            return Ok(new { message = "Quiz đã được xóa thành công." });
        }

        /// <summary>
        /// Teacher analytics: thống kê tổng quan hoạt động quiz từ DB.
        /// GET /api/v1/concepts/quiz/analytics
        /// </summary>
        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            var authCheck = RequireToken();
            if (authCheck != null) return authCheck;

            if (!IsTeacherOrAdmin())
                return StatusCode(403, new { error = "FORBIDDEN", message = "Chỉ Giảng viên hoặc Admin mới xem analytics." });

            var totalQuizzes          = _quizBank.GetAllQuizzes().Count;
            var totalQuestionsInBank  = _quizBank.GetAllQuizzes().Sum(q => q.Questions.Count);
            var topicBreakdown        = _quizBank.GetTopics().Select(t => new
            {
                topic     = t,
                quizCount = _quizBank.GetQuizzesByTopic(t).Count
            });

            // Lấy số lượt từ DB thực (không phải RAM)
            var totalUsers   = await _dbContext.Users.CountAsync();
            var premiumUsers = await _dbContext.Users.CountAsync(u => u.IsPremium);

            return Ok(new
            {
                totalQuizzes,
                totalQuestionsInBank,
                totalUsers,
                premiumUsers,
                topicBreakdown
            });
        }

        // ── JWT Helper ──────────────────────────────────────────────────────

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

        private bool IsTeacherOrAdmin()
        {
            var role = ExtractRoleFromToken(Request.Headers["Authorization"].FirstOrDefault());
            return role == "Teacher" || role == "Admin";
        }

        private static string? ExtractRoleFromToken(string? authHeader)
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

                var json = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payloadBase64));
                using var doc = System.Text.Json.JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("role", out var roleEl))
                    return roleEl.GetString();
            }
            catch { }

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

                var json = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(payloadBase64));
                using var doc = System.Text.Json.JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("sub", out var subEl))
                    return subEl.GetString();
            }
            catch { }

            return null;
        }

        private static string NormalizeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            return System.Text.RegularExpressions.Regex.Replace(text.Trim(), @"\s+", " ");
        }
    }
}
