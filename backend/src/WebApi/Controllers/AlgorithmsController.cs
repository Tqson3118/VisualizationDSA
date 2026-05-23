using Microsoft.AspNetCore.Mvc;
using VisualizationDSA.Application.DTOs;
using VisualizationDSA.Domain.Engine;

namespace VisualizationDSA.WebApi.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AlgorithmsController : ControllerBase
{
    /// <summary>
    /// Thực thi thuật toán và trả về danh sách frames hoạt họa.
    /// POST /api/v1/algorithms/execute
    /// </summary>
    [HttpPost("execute")]
    public ActionResult<AlgorithmResult> Execute([FromBody] AlgorithmRequestDto request)
    {
        if (request.InputData.Length == 0)
        {
            return BadRequest(new
            {
                status = 400,
                title = "Bad Request",
                errorType = "EMPTY_INPUT",
                message = "Mảng dữ liệu đầu vào không được rỗng."
            });
        }

        try
        {
            AlgorithmResult result = request.AlgorithmId.ToLowerInvariant() switch
            {
                "bubble-sort" => new BubbleSortExecutor().Execute(request.InputData),
                _ => throw new NotSupportedException(
                    $"Thuật toán '{request.AlgorithmId}' chưa được hỗ trợ.")
            };

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                status = 400,
                title = "Bad Request",
                errorType = "MEMORY_LIMIT_EXCEEDED",
                message = ex.Message
            });
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(new
            {
                status = 400,
                title = "Bad Request",
                errorType = "UNSUPPORTED_ALGORITHM",
                message = ex.Message
            });
        }
    }
}
