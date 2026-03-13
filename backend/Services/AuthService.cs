using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using wanderSmart.Backend.Configurations;
using wanderSmart.Backend.DTOs;
using wanderSmart.Backend.Interfaces;
using wanderSmart.Backend.Models;
using wanderSmart.Backend.Models.Enums;

namespace wanderSmart.Backend.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    public async Task<LoginResponseDTO> LoginAsync(LoginDTO loginDto, string ipAddress, string userAgent)
    {
        try
        {
            // Find user by username or email
            var user = await _userRepository.GetByUsernameOrEmailAsync(loginDto.UsernameOrEmail);
            
            if (user == null)
            {
                _logger.LogWarning("Login failed for {UsernameOrEmail}: User not found", loginDto.UsernameOrEmail);
                throw new UnauthorizedAccessException("Invalid username/email or password");
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                _logger.LogWarning("Login failed for {UsernameOrEmail}: Invalid password", loginDto.UsernameOrEmail);
                
                // Log failed attempt
                await LogFailedLogin(user.Id, ipAddress, userAgent);
                
                throw new UnauthorizedAccessException("Invalid username/email or password");
            }

            // Check if user is active
            if (!user.IsActive)
            {
                _logger.LogWarning("Login failed for {UsernameOrEmail}: Account is deactivated", loginDto.UsernameOrEmail);
                throw new UnauthorizedAccessException("Account is deactivated. Please contact support.");
            }

            // Update last login
            user = await _userRepository.UpdateLastLoginAsync(user.Id, ipAddress, userAgent);

            // Log successful login activity
            await LogActivity(user.Id, ActivityType.Login, $"User logged in from {ipAddress}", new Dictionary<string, string>
            {
                ["ipAddress"] = ipAddress,
                ["userAgent"] = userAgent
            });

            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            // Get current session ID (last login history entry)
            var currentSession = user.LoginHistory.LastOrDefault();

            return new LoginResponseDTO
            {
                Token = token,
                RefreshToken = currentSession?.SessionId ?? Guid.NewGuid().ToString(),
                ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes),
                User = MapToUserDTO(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {UsernameOrEmail}", loginDto.UsernameOrEmail);
            throw;
        }
    }

    public async Task<UserDTO> RegisterAsync(RegisterDTO registerDto)
    {
        try
        {
            // Check if email already exists
            if (await _userRepository.ExistsByEmailAsync(registerDto.Email))
            {
                throw new InvalidOperationException("Email already registered");
            }

            // Check if username already exists
            if (await _userRepository.ExistsByUsernameAsync(registerDto.Username))
            {
                throw new InvalidOperationException("Username already taken");
            }

            // Create new user
            var user = new User
            {
                Email = registerDto.Email,
                Username = registerDto.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Role = UserRole.User,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LoginCount = 0,
                Preferences = new UserPreferences()
            };

            // Save user
            var createdUser = await _userRepository.CreateAsync(user);

            // Log registration activity
            await LogActivity(createdUser.Id, ActivityType.UpdateProfile, "User registered successfully");

            _logger.LogInformation("User registered successfully: {Username}", createdUser.Username);

            return MapToUserDTO(createdUser);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Username}", registerDto.Username);
            throw;
        }
    }

    public async Task<bool> LogoutAsync(string userId, string sessionId)
    {
        try
        {
            var user = await _userRepository.UpdateLogoutAsync(userId, sessionId);
            
            // Log logout activity
            await LogActivity(userId, ActivityType.Logout, "User logged out");

            _logger.LogInformation("User logged out: {UserId}", userId);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout for {UserId}", userId);
            return false;
        }
    }

    public async Task<UserDTO> GetCurrentUserAsync(string userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException("User not found");
        }

        return MapToUserDTO(user);
    }

    public async Task<List<UserActivityDTO>> GetUserActivitiesAsync(string userId, int limit = 50)
    {
        var activities = await _userRepository.GetUserActivitiesAsync(userId, limit);
        
        return activities.Select(a => new UserActivityDTO
        {
            Id = a.Id,
            ActivityType = a.ActivityType.ToString(),
            Description = a.Description,
            Timestamp = a.Timestamp,
            Metadata = a.Metadata
        }).ToList();
    }

    public async Task<Dictionary<string, int>> GetUserActivityStatsAsync(string userId)
    {
        return await _userRepository.GetActivityStatsAsync(userId);
    }

    private string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_jwtSettings.Secret);
        
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("LoginCount", user.LoginCount.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), 
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private async Task LogActivity(string userId, ActivityType type, string description, 
        Dictionary<string, string>? metadata = null)
    {
        var activity = new UserActivity
        {
            ActivityType = type,
            Description = description,
            Timestamp = DateTime.UtcNow,
            Metadata = metadata ?? new Dictionary<string, string>()
        };

        await _userRepository.AddActivityAsync(userId, activity);
    }

    private async Task LogFailedLogin(string userId, string ipAddress, string userAgent)
    {
        var loginHistory = new LoginHistory
        {
            LoginTime = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsSuccessful = false,
            FailureReason = "Invalid password",
            SessionId = Guid.NewGuid().ToString()
        };

        await _userRepository.AddLoginHistoryAsync(userId, loginHistory);
    }

    private UserDTO MapToUserDTO(User user)
    {
        return new UserDTO
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role.ToString(),
            LoginCount = user.LoginCount,
            LastLoginAt = user.LastLoginAt,
            Preferences = user.Preferences != null ? new UserPreferencesDTO
            {
                BudgetLevel = user.Preferences.BudgetLevel.ToString(),
                PreferredTravelStyles = user.Preferences.PreferredTravelStyles.Select(s => s.ToString()).ToList(),
                PreferredActivities = user.Preferences.PreferredActivities.Select(a => a.ToString()).ToList(),
                FavoriteDestinations = user.Preferences.FavoriteDestinations,
                Currency = user.Preferences.Currency
            } : null
        };
    }
}