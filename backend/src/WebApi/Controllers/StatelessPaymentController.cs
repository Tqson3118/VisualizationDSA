using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using VisualizationDSA.Domain.Engine;
using VisualizationDSA.Domain.Strategies;

namespace VisualizationDSA.WebApi.Controllers
{
    /// <summary>
    /// Stateless Payment Controller — thanh toán Premium mà KHÔNG cần PostgreSQL / SePay.
    /// Route: api/v{version:apiVersion}/concepts/payment
    /// </summary>
    [ApiVersion("1.0")]
    [ApiController]
    [Route("api/v{version:apiVersion}/concepts/payment")]
    public class StatelessPaymentController : ControllerBase
    {
        private readonly StatelessPaymentStrategy _paymentStrategy;

        public StatelessPaymentController(StatelessPaymentStrategy paymentStrategy)
        {
            _paymentStrategy = paymentStrategy;
        }

        /// <summary>
        /// Lấy cấu hình thanh toán (giá, ngân hàng, danh sách tính năng Premium).
        /// GET /api/v1/concepts/payment/config
        /// </summary>
        [HttpGet("config")]
        public ActionResult<StatelessPaymentConfigDto> GetConfig()
        {
            return Ok(_paymentStrategy.GetConfig());
        }

        /// <summary>
        /// Tạo hóa đơn thanh toán (checkout) — sinh mã QR VietQR.
        /// POST /api/v1/concepts/payment/checkout
        /// </summary>
        [HttpPost("checkout")]
        public ActionResult<StatelessOrderDto> Checkout([FromBody] StatelessCheckoutRequest request)
        {
            try
            {
                var userId = request.UserId ?? "demo-user-001";
                var order = _paymentStrategy.CreateCheckout(userId, request.PaymentMethod);
                return Ok(order);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = "CHECKOUT_FAILED", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = "ALREADY_PREMIUM", message = ex.Message });
            }
        }

        /// <summary>
        /// Xác nhận thanh toán thành công (simulate verify).
        /// POST /api/v1/concepts/payment/verify
        /// </summary>
        [HttpPost("verify")]
        public ActionResult<StatelessOrderDto> Verify([FromBody] StatelessVerifyRequest request)
        {
            try
            {
                var order = _paymentStrategy.VerifyPayment(request.OrderId, request.UserId);
                return Ok(order);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "ORDER_NOT_FOUND", message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = "UNAUTHORIZED", message = ex.Message });
            }
        }

        /// <summary>
        /// Truy vấn trạng thái hóa đơn (polling).
        /// GET /api/v1/concepts/payment/orders/{orderId}/status?userId=...
        /// </summary>
        [HttpGet("orders/{orderId}/status")]
        public ActionResult<StatelessOrderDto> GetOrderStatus(string orderId, [FromQuery] string? userId)
        {
            try
            {
                var order = _paymentStrategy.GetOrderStatus(orderId, userId);
                return Ok(order);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "ORDER_NOT_FOUND", message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = "UNAUTHORIZED", message = ex.Message });
            }
        }

        /// <summary>
        /// Mô phỏng webhook ngân hàng xác nhận đã nhận tiền.
        /// POST /api/v1/concepts/payment/simulate-webhook
        /// </summary>
        [HttpPost("simulate-webhook")]
        public ActionResult<StatelessOrderDto> SimulateWebhook([FromBody] StatelessVerifyRequest request)
        {
            try
            {
                var order = _paymentStrategy.SimulateWebhook(request.OrderId);
                return Ok(order);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { error = "ORDER_NOT_FOUND", message = ex.Message });
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái Premium của user.
        /// GET /api/v1/concepts/payment/premium-status?userId=...
        /// </summary>
        [HttpGet("premium-status")]
        public ActionResult<StatelessPremiumStatusDto> GetPremiumStatus([FromQuery] string? userId)
        {
            var id = userId ?? "demo-user-001";
            return Ok(_paymentStrategy.GetPremiumStatus(id));
        }

        /// <summary>
        /// Kiểm tra quyền truy cập tính năng Premium.
        /// GET /api/v1/concepts/payment/check-access?userId=...&featureId=...
        /// </summary>
        [HttpGet("check-access")]
        public ActionResult<object> CheckFeatureAccess([FromQuery] string? userId, [FromQuery] string featureId)
        {
            var id = userId ?? "demo-user-001";
            var hasAccess = _paymentStrategy.CheckFeatureAccess(id, featureId);
            return Ok(new { userId = id, featureId, hasAccess });
        }

        /// <summary>
        /// Lấy lịch sử giao dịch.
        /// GET /api/v1/concepts/payment/transactions?userId=...
        /// </summary>
        [HttpGet("transactions")]
        public ActionResult<List<StatelessTransactionLogEntry>> GetTransactions([FromQuery] string? userId)
        {
            var log = _paymentStrategy.GetTransactionLog(userId);
            return Ok(log);
        }
    }
}
