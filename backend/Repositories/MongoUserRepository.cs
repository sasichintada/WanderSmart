using MongoDB.Driver;
using wanderSmart.Backend.Data;
using wanderSmart.Backend.Interfaces;
using wanderSmart.Backend.Models;

namespace wanderSmart.Backend.Repositories;

public class MongoUserRepository : IUserRepository
{
    private readonly MongoDbContext _context;
    private readonly ILogger<MongoUserRepository> _logger;

    public MongoUserRepository(MongoDbContext context, ILogger<MongoUserRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _context.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.Find(u => u.Email.ToLower() == email.ToLower()).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users.Find(u => u.Username.ToLower() == username.ToLower()).FirstOrDefaultAsync();
    }

    public async Task<User?> GetByUsernameOrEmailAsync(string usernameOrEmail)
    {
        var filter = Builders<User>.Filter.Or(
            Builders<User>.Filter.Regex(u => u.Email, new MongoDB.Bson.BsonRegularExpression($"^{usernameOrEmail}$", "i")),
            Builders<User>.Filter.Regex(u => u.Username, new MongoDB.Bson.BsonRegularExpression($"^{usernameOrEmail}$", "i"))
        );
        
        return await _context.Users.Find(filter).FirstOrDefaultAsync();
    }

    public async Task<List<User>> GetAllAsync(int page = 1, int pageSize = 10)
    {
        return await _context.Users
            .Find(_ => true)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<User> CreateAsync(User user)
    {
        user.CreatedAt = DateTime.UtcNow;
        await _context.Users.InsertOneAsync(user);
        return user;
    }

    public async Task<bool> UpdateAsync(User user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        var result = await _context.Users.ReplaceOneAsync(u => u.Id == user.Id, user);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.Users.DeleteOneAsync(u => u.Id == id);
        return result.IsAcknowledged && result.DeletedCount > 0;
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await _context.Users.Find(u => u.Email.ToLower() == email.ToLower()).AnyAsync();
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        return await _context.Users.Find(u => u.Username.ToLower() == username.ToLower()).AnyAsync();
    }

    public async Task<User> AddLoginHistoryAsync(string userId, LoginHistory history)
    {
        var update = Builders<User>.Update
            .Push(u => u.LoginHistory, history)
            .Set(u => u.LastLoginAt, history.LoginTime)
            .Inc(u => u.LoginCount, 1);
        
        var result = await _context.Users.UpdateOneAsync(u => u.Id == userId, update);
        
        if (result.IsAcknowledged && result.ModifiedCount > 0)
        {
            return await GetByIdAsync(userId) ?? throw new Exception("User not found after update");
        }
        
        throw new Exception("Failed to add login history");
    }

    public async Task<User> AddActivityAsync(string userId, UserActivity activity)
    {
        var update = Builders<User>.Update.Push(u => u.Activities, activity);
        
        // Keep only last 100 activities to prevent document growth
        var slice = Builders<User>.Update.Push(u => u.Activities, activity);
        
        var result = await _context.Users.UpdateOneAsync(u => u.Id == userId, update);
        
        if (result.IsAcknowledged && result.ModifiedCount > 0)
        {
            return await GetByIdAsync(userId) ?? throw new Exception("User not found after update");
        }
        
        throw new Exception("Failed to add activity");
    }

    public async Task<User> UpdateLastLoginAsync(string userId, string ipAddress, string userAgent)
    {
        var sessionId = Guid.NewGuid().ToString();
        var loginHistory = new LoginHistory
        {
            LoginTime = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            DeviceInfo = ParseUserAgent(userAgent),
            IsSuccessful = true,
            SessionId = sessionId
        };

        return await AddLoginHistoryAsync(userId, loginHistory);
    }

    public async Task<User> UpdateLogoutAsync(string userId, string sessionId)
    {
        var user = await GetByIdAsync(userId);
        if (user == null) throw new Exception("User not found");

        var loginHistory = user.LoginHistory.FirstOrDefault(l => l.SessionId == sessionId);
        if (loginHistory != null)
        {
            loginHistory.LogoutTime = DateTime.UtcNow;
            user.LastLogoutAt = DateTime.UtcNow;
            
            var update = Builders<User>.Update
                .Set(u => u.LoginHistory[-1].LogoutTime, DateTime.UtcNow)
                .Set(u => u.LastLogoutAt, DateTime.UtcNow);
            
            await _context.Users.UpdateOneAsync(u => u.Id == userId, update);
        }

        return user;
    }

    public async Task<List<UserActivity>> GetUserActivitiesAsync(string userId, int limit = 50)
    {
        var user = await GetByIdAsync(userId);
        return user?.Activities
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .ToList() ?? new List<UserActivity>();
    }

    public async Task<Dictionary<string, int>> GetActivityStatsAsync(string userId)
    {
        var user = await GetByIdAsync(userId);
        if (user == null) return new Dictionary<string, int>();

        return user.Activities
            .GroupBy(a => a.ActivityType.ToString())
            .ToDictionary(g => g.Key, g => g.Count());
    }

    private string ParseUserAgent(string userAgent)
    {
        // Simple user agent parsing - in production use a proper parser like UAParser
        if (string.IsNullOrEmpty(userAgent)) return "Unknown";
        
        if (userAgent.Contains("Windows")) return "Windows";
        if (userAgent.Contains("Mac")) return "macOS";
        if (userAgent.Contains("Linux")) return "Linux";
        if (userAgent.Contains("Android")) return "Android";
        if (userAgent.Contains("iPhone")) return "iOS";
        
        return "Unknown";
    }
}