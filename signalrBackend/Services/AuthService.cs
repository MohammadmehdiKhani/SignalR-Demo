using Microsoft.IdentityModel.Tokens;
using signalrBackend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace signalrBackend.Services
{
    public class AuthService
    {
        private readonly List<User> _users = new();
        private readonly string _jwtSecret = "YourSuperSecretKey123!@#$%^&*()_+";
        private readonly string _jwtIssuer = "SignalRApp";
        private readonly string _jwtAudience = "SignalRUsers";

        public AuthResponse Register(RegisterRequest request)
        {
            // Check if user already exists
            if (_users.Any(u => u.Username == request.Username))
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "کاربر با این نام کاربری قبلاً وجود دارد"
                };
            }

            // Create new user
            var user = new User
            {
                Username = request.Username,
                Password = request.Password // In real app, hash the password
            };

            _users.Add(user);

            // Generate JWT token
            var token = GenerateJwtToken(user.Username);

            return new AuthResponse
            {
                Success = true,
                Token = token,
                Username = user.Username,
                Message = "ثبت‌نام با موفقیت انجام شد"
            };
        }

        public AuthResponse Login(LoginRequest request)
        {
            var user = _users.FirstOrDefault(u => 
                u.Username == request.Username && 
                u.Password == request.Password);

            if (user == null)
            {
                return new AuthResponse
                {
                    Success = false,
                    Message = "نام کاربری یا رمز عبور اشتباه است"
                };
            }

            // Generate JWT token
            var token = GenerateJwtToken(user.Username);

            return new AuthResponse
            {
                Success = true,
                Token = token,
                Username = user.Username,
                Message = "ورود با موفقیت انجام شد"
            };
        }

        private string GenerateJwtToken(string username)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var token = new JwtSecurityToken(
                issuer: _jwtIssuer,
                audience: _jwtAudience,
                claims: claims,
                expires: DateTime.Now.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtSecret);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = _jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public string? GetUsernameFromToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtSecret);

                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = _jwtAudience,
                    ValidateLifetime = false, // Don't validate lifetime for this method
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken validatedToken);
                return principal.Identity?.Name;
            }
            catch
            {
                return null;
            }
        }
    }
} 