using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using wanderSmart.Backend.Models.Enums;

namespace wanderSmart.Backend.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Email { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    
    // Login Tracking
    public int LoginCount { get; set; } = 0;
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastLogoutAt { get; set; }
    public List<LoginHistory> LoginHistory { get; set; } = new();
    
    // Activity Tracking
    public List<UserActivity> Activities { get; set; } = new();
    
    // Preferences
    public UserPreferences Preferences { get; set; } = new();
    
    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class LoginHistory
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public DateTime LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public string IpAddress { get; set; } = null!;
    public string UserAgent { get; set; } = null!;
    public string DeviceInfo { get; set; } = null!;
    public string Location { get; set; } = "Unknown";
    public bool IsSuccessful { get; set; }
    public string? FailureReason { get; set; }
    public string SessionId { get; set; } = null!;
}

public class UserActivity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    public ActivityType ActivityType { get; set; }
    public string Description { get; set; } = null!;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, string> Metadata { get; set; } = new();
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}

public class UserPreferences
{
    public BudgetLevel BudgetLevel { get; set; } = BudgetLevel.Medium;
    public List<TravelStyle> PreferredTravelStyles { get; set; } = new();
    public List<ActivityCategory> PreferredActivities { get; set; } = new();
    public List<string> FavoriteDestinations { get; set; } = new();
    public bool ReceiveNotifications { get; set; } = true;
    public bool ReceiveNewsletters { get; set; } = false;
    public string Language { get; set; } = "en";
    public string Currency { get; set; } = "USD";
}