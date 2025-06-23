using Microsoft.AspNetCore.Mvc;
using signalrBackend.Models;
using signalrBackend.Services;

namespace signalrBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public ActionResult<AuthResponse> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "نام کاربری و رمز عبور الزامی است"
                });
            }

            var response = _authService.Register(request);
            
            if (response.Success)
            {
                return Ok(response);
            }
            
            return BadRequest(response);
        }

        [HttpPost("login")]
        public ActionResult<AuthResponse> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "نام کاربری و رمز عبور الزامی است"
                });
            }

            var response = _authService.Login(request);
            
            if (response.Success)
            {
                return Ok(response);
            }
            
            return BadRequest(response);
        }

        [HttpPost("validate")]
        public ActionResult ValidateToken([FromBody] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { Success = false, Message = "توکن الزامی است" });
            }

            var isValid = _authService.ValidateToken(token);
            
            if (isValid)
            {
                var username = _authService.GetUsernameFromToken(token);
                return Ok(new { Success = true, Username = username });
            }
            
            return BadRequest(new { Success = false, Message = "توکن نامعتبر است" });
        }
    }
} 