using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDTO> LoginAsync(LoginDTO loginDto, string ipAddress, string userAgent);
    Task<UserDTO> RegisterAsync(RegisterDTO registerDto);
    Task<bool> LogoutAsync(string userId, string sessionId);
    Task<UserDTO> GetCurrentUserAsync(string userId);
    Task<List<UserActivityDTO>> GetUserActivitiesAsync(string userId, int limit = 50);
    Task<Dictionary<string, int>> GetUserActivityStatsAsync(string userId);
}