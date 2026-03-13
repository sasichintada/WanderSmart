using System.ComponentModel.DataAnnotations;

namespace wanderSmart.Backend.DTOs;

/// <summary>
/// User registration request DTO
/// </summary>
public class RegisterDTO
{
    /// <summary>
    /// User's email address (must be unique)
    /// </summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
    
    /// <summary>
    /// Unique username for the user
    /// </summary>
    [Required]
    [MinLength(3)]
    public string Username { get; set; } = null!;
    
    /// <summary>
    /// Password (minimum 6 characters)
    /// </summary>
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = null!;
    
    /// <summary>
    /// User's first name (optional)
    /// </summary>
    public string? FirstName { get; set; }
    
    /// <summary>
    /// User's last name (optional)
    /// </summary>
    public string? LastName { get; set; }
}

/// <summary>
/// Login request DTO
/// </summary>
public class LoginDTO
{
    /// <summary>
    /// Username or email address
    /// </summary>
    [Required]
    public string UsernameOrEmail { get; set; } = null!;
    
    /// <summary>
    /// User password
    /// </summary>
    [Required]
    public string Password { get; set; } = null!;
}

/// <summary>
/// Login response DTO with JWT token
/// </summary>
public class LoginResponseDTO
{
    /// <summary>
    /// JWT access token
    /// </summary>
    public string Token { get; set; } = null!;
    
    /// <summary>
    /// Refresh token for getting new access tokens
    /// </summary>
    public string RefreshToken { get; set; } = null!;
    
    /// <summary>
    /// Token expiration date and time
    /// </summary>
    public DateTime ExpiresAt { get; set; }
    
    /// <summary>
    /// User information
    /// </summary>
    public UserDTO User { get; set; } = null!;
}

/// <summary>
/// User profile DTO
/// </summary>
public class UserDTO
{
    /// <summary>
    /// Unique user identifier
    /// </summary>
    public string Id { get; set; } = null!;
    
    /// <summary>
    /// User email address
    /// </summary>
    public string Email { get; set; } = null!;
    
    /// <summary>
    /// Username
    /// </summary>
    public string Username { get; set; } = null!;
    
    /// <summary>
    /// First name
    /// </summary>
    public string? FirstName { get; set; }
    
    /// <summary>
    /// Last name
    /// </summary>
    public string? LastName { get; set; }
    
    /// <summary>
    /// Full name (combination of first and last name)
    /// </summary>
    public string? FullName => $"{FirstName} {LastName}".Trim();
    
    /// <summary>
    /// User role (e.g., "User", "Admin")
    /// </summary>
    public string Role { get; set; } = null!;
    
    /// <summary>
    /// Number of times user has logged in
    /// </summary>
    public int LoginCount { get; set; }
    
    /// <summary>
    /// Last login timestamp
    /// </summary>
    public DateTime? LastLoginAt { get; set; }
    
    /// <summary>
    /// User preferences for travel
    /// </summary>
    public UserPreferencesDTO? Preferences { get; set; }
}

/// <summary>
/// User preferences for travel planning
/// </summary>
public class UserPreferencesDTO
{
    /// <summary>
    /// Budget level (Low, Medium, High, Luxury)
    /// </summary>
    public string BudgetLevel { get; set; } = null!;
    
    /// <summary>
    /// Preferred travel styles (Adventure, Relaxation, Cultural, etc.)
    /// </summary>
    public List<string> PreferredTravelStyles { get; set; } = new();
    
    /// <summary>
    /// Preferred activities (Sightseeing, Shopping, Food, etc.)
    /// </summary>
    public List<string> PreferredActivities { get; set; } = new();
    
    /// <summary>
    /// Favorite destinations
    /// </summary>
    public List<string> FavoriteDestinations { get; set; } = new();
    
    /// <summary>
    /// Preferred currency (INR, USD, EUR, etc.)
    /// </summary>
    public string Currency { get; set; } = null!;
}

/// <summary>
/// User activity log DTO
/// </summary>
public class UserActivityDTO
{
    /// <summary>
    /// Activity identifier
    /// </summary>
    public string Id { get; set; } = null!;
    
    /// <summary>
    /// Type of activity (Login, ItineraryCreated, etc.)
    /// </summary>
    public string ActivityType { get; set; } = null!;
    
    /// <summary>
    /// Activity description
    /// </summary>
    public string Description { get; set; } = null!;
    
    /// <summary>
    /// When the activity occurred
    /// </summary>
    public DateTime Timestamp { get; set; }
    
    /// <summary>
    /// Additional metadata about the activity
    /// </summary>
    public Dictionary<string, string> Metadata { get; set; } = new();
}

/// <summary>
/// Login history record DTO
/// </summary>
public class LoginHistoryDTO
{
    /// <summary>
    /// Login record identifier
    /// </summary>
    public string Id { get; set; } = null!;
    
    /// <summary>
    /// Login timestamp
    /// </summary>
    public DateTime LoginTime { get; set; }
    
    /// <summary>
    /// Logout timestamp (if applicable)
    /// </summary>
    public DateTime? LogoutTime { get; set; }
    
    /// <summary>
    /// IP address of the login
    /// </summary>
    public string IpAddress { get; set; } = null!;
    
    /// <summary>
    /// Device information
    /// </summary>
    public string DeviceInfo { get; set; } = null!;
    
    /// <summary>
    /// Geographic location
    /// </summary>
    public string Location { get; set; } = null!;
    
    /// <summary>
    /// Whether the login was successful
    /// </summary>
    public bool IsSuccessful { get; set; }
}