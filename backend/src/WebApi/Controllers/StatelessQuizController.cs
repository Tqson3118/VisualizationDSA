using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using VisualizationDSA.Domain.Engine;
using VisualizationDSA.Domain.Strategies;

namespace VisualizationDSA.WebApi.Controllers
{
    /// <summary>
    /// Stateless Quiz API — serves pre-built quiz bank without database.
    /// Route: /api/v1/concepts/quiz
    /// </summary>
    [ApiVersion("1.0")]
    [ApiController]
    [Route("api/v{version:apiVersion}/concepts/quiz")]
    public class StatelessQuizController : ControllerBase
    {
        private readonly QuizBankStrategy _quizBank;

        public StatelessQuizController(QuizBankStrategy quizBank)
        {
            _quizBank = quizBank;
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
        /// Submit câu trả lời và nhận kết quả chấm điểm.
        /// POST /api/v1/concepts/quiz/submit
        /// </summary>
        [HttpPost("submit")]
        public IActionResult SubmitAttempt([FromBody] StatelessQuizAttemptRequest request)
        {
            try
            {
                var result = _quizBank.EvaluateAttempt(request);
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
    }
}
