using wanderSmart.Backend.Models;

namespace wanderSmart.Backend.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(string id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByUsernameOrEmailAsync(string usernameOrEmail);
    Task<List<User>> GetAllAsync(int page = 1, int pageSize = 10);
    Task<User> CreateAsync(User user);
    Task<bool> UpdateAsync(User user);
    Task<bool> DeleteAsync(string id);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByUsernameAsync(string username);
    
    // Activity tracking methods
    Task<User> AddLoginHistoryAsync(string userId, LoginHistory history);
    Task<User> AddActivityAsync(string userId, UserActivity activity);
    Task<User> UpdateLastLoginAsync(string userId, string ipAddress, string userAgent);
    Task<User> UpdateLogoutAsync(string userId, string sessionId);
    Task<List<UserActivity>> GetUserActivitiesAsync(string userId, int limit = 50);
    Task<Dictionary<string, int>> GetActivityStatsAsync(string userId);
}