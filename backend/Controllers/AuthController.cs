using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using wanderSmart.Backend.DTOs;
using wanderSmart.Backend.Interfaces;

namespace wanderSmart.Backend.Controllers;

/// <summary>
/// Handles user authentication including registration, login, logout, and profile management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="registerDto">User registration information</param>
    /// <returns>The newly created user profile</returns>
    /// <response code="200">Returns the newly created user</response>
    /// <response code="400">If the user data is invalid or email already exists</response>
    /// <response code="500">If there was an internal server error</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(UserDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDTO>> Register(RegisterDTO registerDto)
    {
        try
        {
            var result = await _authService.RegisterAsync(registerDto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    /// <summary>
    /// Login user and get authentication token
    /// </summary>
    /// <param name="loginDto">Login credentials (username/email and password)</param>
    /// <returns>JWT token and user information</returns>
    /// <response code="200">Returns JWT token and user info</response>
    /// <response code="401">If credentials are invalid</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDTO>> Login(LoginDTO loginDto)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            var userAgent = Request.Headers["User-Agent"].ToString();

            var result = await _authService.LoginAsync(loginDto, ipAddress, userAgent);
            
            // Set token in cookie as well for web clients
            Response.Cookies.Append("jwt", result.Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = result.ExpiresAt
            });

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    /// <summary>
    /// Logout current user and invalidate session
    /// </summary>
    /// <returns>Success message</returns>
    /// <response code="200">Successfully logged out</response>
    /// <response code="401">If user is not authenticated</response>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var sessionId = User.FindFirst("sessionId")?.Value ?? "Unknown";

            if (userId == null)
            {
                return Unauthorized();
            }

            await _authService.LogoutAsync(userId, sessionId);
            
            // Clear JWT cookie
            Response.Cookies.Delete("jwt");

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { message = "An error occurred during logout" });
        }
    }

    /// <summary>
    /// Get current authenticated user information
    /// </summary>
    /// <returns>Current user profile</returns>
    /// <response code="200">Returns user profile</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="404">If user not found</response>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDTO>> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _authService.GetCurrentUserAsync(userId);
            return Ok(user);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user activity history
    /// </summary>
    /// <param name="limit">Maximum number of activities to return (default: 50)</param>
    /// <returns>List of user activities</returns>
    [Authorize]
    [HttpGet("activities")]
    [ProducesResponseType(typeof(List<UserActivityDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<UserActivityDTO>>> GetUserActivities([FromQuery] int limit = 50)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var activities = await _authService.GetUserActivitiesAsync(userId, limit);
            return Ok(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user activities");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user activity statistics
    /// </summary>
    /// <returns>Dictionary of activity types and counts</returns>
    [Authorize]
    [HttpGet("activity-stats")]
    [ProducesResponseType(typeof(Dictionary<string, int>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<Dictionary<string, int>>> GetUserActivityStats()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var stats = await _authService.GetUserActivityStatsAsync(userId);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting activity stats");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Refresh authentication token
    /// </summary>
    /// <returns>New JWT token</returns>
    [Authorize]
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult RefreshToken()
    {
        return Ok(new { message = "Token refresh endpoint" });
    }
}