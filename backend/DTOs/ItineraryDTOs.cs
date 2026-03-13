using System.ComponentModel.DataAnnotations;

namespace wanderSmart.Backend.DTOs;

/// <summary>
/// Request DTO for creating a new itinerary
/// </summary>
public class CreateItineraryDTO
{
    /// <summary>
    /// Itinerary title
    /// </summary>
    [Required]
    public string Title { get; set; } = null!;
    
    /// <summary>
    /// Destination city
    /// </summary>
    [Required]
    public string Destination { get; set; } = null!;
    
    /// <summary>
    /// Itinerary description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Start date of the trip
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }
    
    /// <summary>
    /// End date of the trip
    /// </summary>
    [Required]
    public DateTime EndDate { get; set; }
    
    /// <summary>
    /// Total budget for the trip
    /// </summary>
    [Range(0, double.MaxValue)]
    public decimal TotalBudget { get; set; }
    
    /// <summary>
    /// Budget level (Low, Medium, High, Luxury)
    /// </summary>
    public string BudgetLevel { get; set; } = "Medium";
    
    /// <summary>
    /// Travel style (Adventure, Relaxation, Cultural, etc.)
    /// </summary>
    public string TravelStyle { get; set; } = "Adventure";
    
    /// <summary>
    /// Tags for the itinerary
    /// </summary>
    public List<string> Tags { get; set; } = new();
    
    /// <summary>
    /// Whether the itinerary is public
    /// </summary>
    public bool IsPublic { get; set; }
    
    /// <summary>
    /// Day-by-day plan
    /// </summary>
    public List<DayPlanDTO>? Days { get; set; }
}

/// <summary>
/// Request DTO for updating an itinerary
/// </summary>
public class UpdateItineraryDTO
{
    /// <summary>
    /// Itinerary title
    /// </summary>
    public string? Title { get; set; }
    
    /// <summary>
    /// Itinerary description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Start date of the trip
    /// </summary>
    public DateTime? StartDate { get; set; }
    
    /// <summary>
    /// End date of the trip
    /// </summary>
    public DateTime? EndDate { get; set; }
    
    /// <summary>
    /// Total budget for the trip
    /// </summary>
    public decimal? TotalBudget { get; set; }
    
    /// <summary>
    /// Budget level (Low, Medium, High, Luxury)
    /// </summary>
    public string? BudgetLevel { get; set; }
    
    /// <summary>
    /// Travel style (Adventure, Relaxation, Cultural, etc.)
    /// </summary>
    public string? TravelStyle { get; set; }
    
    /// <summary>
    /// Tags for the itinerary
    /// </summary>
    public List<string>? Tags { get; set; }
    
    /// <summary>
    /// Whether the itinerary is public
    /// </summary>
    public bool? IsPublic { get; set; }
    
    /// <summary>
    /// Day-by-day plan
    /// </summary>
    public List<DayPlanDTO>? Days { get; set; }
}

/// <summary>
/// Response DTO for itinerary
/// </summary>
public class ItineraryResponseDTO
{
    /// <summary>
    /// Itinerary identifier
    /// </summary>
    public string Id { get; set; } = null!;
    
    /// <summary>
    /// User ID who created the itinerary
    /// </summary>
    public string UserId { get; set; } = null!;
    
    /// <summary>
    /// Username of the creator
    /// </summary>
    public string UserName { get; set; } = null!;
    
    /// <summary>
    /// Itinerary title
    /// </summary>
    public string Title { get; set; } = null!;
    
    /// <summary>
    /// Destination city
    /// </summary>
    public string Destination { get; set; } = null!;
    
    /// <summary>
    /// Itinerary description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Start date of the trip
    /// </summary>
    public DateTime StartDate { get; set; }
    
    /// <summary>
    /// End date of the trip
    /// </summary>
    public DateTime EndDate { get; set; }
    
    /// <summary>
    /// Duration of the trip in days
    /// </summary>
    public int Duration => (EndDate - StartDate).Days + 1;
    
    /// <summary>
    /// Total budget for the trip
    /// </summary>
    public decimal TotalBudget { get; set; }
    
    /// <summary>
    /// Budget level (Low, Medium, High, Luxury)
    /// </summary>
    public string BudgetLevel { get; set; } = null!;
    
    /// <summary>
    /// Travel style (Adventure, Relaxation, Cultural, etc.)
    /// </summary>
    public string TravelStyle { get; set; } = null!;
    
    /// <summary>
    /// Day-by-day plan
    /// </summary>
    public List<DayPlanDTO> Days { get; set; } = new();
    
    /// <summary>
    /// Tags for the itinerary
    /// </summary>
    public List<string> Tags { get; set; } = new();
    
    /// <summary>
    /// Whether the itinerary is public
    /// </summary>
    public bool IsPublic { get; set; }
    
    /// <summary>
    /// Number of views
    /// </summary>
    public int Views { get; set; }
    
    /// <summary>
    /// Number of likes
    /// </summary>
    public int Likes { get; set; }
    
    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Day plan DTO
/// </summary>
public class DayPlanDTO
{
    /// <summary>
    /// Day number (1, 2, 3, etc.)
    /// </summary>
    public int DayNumber { get; set; }
    
    /// <summary>
    /// Date of the day
    /// </summary>
    public DateTime Date { get; set; }
    
    /// <summary>
    /// Theme of the day
    /// </summary>
    public string? Theme { get; set; }
    
    /// <summary>
    /// Activities planned for the day
    /// </summary>
    public List<ActivityDTO> Activities { get; set; } = new();
    
    /// <summary>
    /// Additional notes
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// Activity DTO
/// </summary>
public class ActivityDTO
{
    /// <summary>
    /// Activity identifier
    /// </summary>
    public string? Id { get; set; }
    
    /// <summary>
    /// Activity name
    /// </summary>
    public string Name { get; set; } = null!;
    
    /// <summary>
    /// Activity description
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Start time (HH:MM format)
    /// </summary>
    public string StartTime { get; set; } = "09:00";
    
    /// <summary>
    /// End time (HH:MM format)
    /// </summary>
    public string EndTime { get; set; } = "11:00";
    
    /// <summary>
    /// Location name
    /// </summary>
    public string Location { get; set; } = null!;
    
    /// <summary>
    /// Latitude coordinate
    /// </summary>
    public double Latitude { get; set; }
    
    /// <summary>
    /// Longitude coordinate
    /// </summary>
    public double Longitude { get; set; }
    
    /// <summary>
    /// Cost of the activity
    /// </summary>
    public decimal Cost { get; set; }
    
    /// <summary>
    /// Activity category
    /// </summary>
    public string Category { get; set; } = null!;
    
    /// <summary>
    /// Image URL
    /// </summary>
    public string? ImageUrl { get; set; }
    
    /// <summary>
    /// Whether the activity is booked
    /// </summary>
    public bool IsBooked { get; set; }
    
    /// <summary>
    /// Booking reference number
    /// </summary>
    public string? BookingReference { get; set; }
}

/// <summary>
/// Request DTO for generating an AI itinerary
/// </summary>
public class GenerateItineraryRequestDTO
{
    /// <summary>
    /// Destination city
    /// </summary>
    [Required]
    public string Destination { get; set; } = string.Empty;
    
    /// <summary>
    /// Start date of the trip
    /// </summary>
    [Required]
    public DateTime StartDate { get; set; }
    
    /// <summary>
    /// End date of the trip
    /// </summary>
    [Required]
    public DateTime EndDate { get; set; }
    
    /// <summary>
    /// Number of travelers
    /// </summary>
    [Range(1, 20)]
    public int Travelers { get; set; } = 1;
    
    /// <summary>
    /// Total budget
    /// </summary>
    [Range(0, double.MaxValue)]
    public decimal Budget { get; set; }
    
    /// <summary>
    /// Travel preferences (e.g., "adventure", "food", "history")
    /// </summary>
    public List<string> Preferences { get; set; } = new();
}

/// <summary>
/// Response DTO for generated itinerary
/// </summary>
public class GeneratedItineraryResponseDTO
{
    /// <summary>
    /// Itinerary identifier
    /// </summary>
    public string Id { get; set; } = string.Empty;
    
    /// <summary>
    /// Itinerary title
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// Destination city
    /// </summary>
    public string Destination { get; set; } = string.Empty;
    
    /// <summary>
    /// Itinerary description
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Start date of the trip
    /// </summary>
    public DateTime StartDate { get; set; }
    
    /// <summary>
    /// End date of the trip
    /// </summary>
    public DateTime EndDate { get; set; }
    
    /// <summary>
    /// Duration in days
    /// </summary>
    public int Duration { get; set; }
    
    /// <summary>
    /// Total budget
    /// </summary>
    public decimal TotalBudget { get; set; }
    
    /// <summary>
    /// Budget level
    /// </summary>
    public string BudgetLevel { get; set; } = string.Empty;
    
    /// <summary>
    /// Travel style
    /// </summary>
    public string TravelStyle { get; set; } = string.Empty;
    
    /// <summary>
    /// Day-by-day plan
    /// </summary>
    public List<GeneratedDayPlanDTO> Days { get; set; } = new();
    
    /// <summary>
    /// Tags for the itinerary
    /// </summary>
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// Generated day plan DTO
/// </summary>
public class GeneratedDayPlanDTO
{
    /// <summary>
    /// Day number
    /// </summary>
    public int DayNumber { get; set; }
    
    /// <summary>
    /// Date of the day
    /// </summary>
    public DateTime Date { get; set; }
    
    /// <summary>
    /// Theme of the day
    /// </summary>
    public string Theme { get; set; } = string.Empty;
    
    /// <summary>
    /// Activities for the day
    /// </summary>
    public List<GeneratedActivityDTO> Activities { get; set; } = new();
    
    /// <summary>
    /// Additional notes
    /// </summary>
    public string Notes { get; set; } = string.Empty;
    
    /// <summary>
    /// Total cost for the day
    /// </summary>
    public decimal DailyTotal { get; set; }
}

/// <summary>
/// Generated activity DTO
/// </summary>
public class GeneratedActivityDTO
{
    /// <summary>
    /// Activity identifier
    /// </summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    /// <summary>
    /// Activity name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Activity description
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Start time
    /// </summary>
    public string StartTime { get; set; } = string.Empty;
    
    /// <summary>
    /// End time
    /// </summary>
    public string EndTime { get; set; } = string.Empty;
    
    /// <summary>
    /// Location name
    /// </summary>
    public string Location { get; set; } = string.Empty;
    
    /// <summary>
    /// Full address
    /// </summary>
    public string Address { get; set; } = string.Empty;
    
    /// <summary>
    /// Latitude coordinate
    /// </summary>
    public double Latitude { get; set; }
    
    /// <summary>
    /// Longitude coordinate
    /// </summary>
    public double Longitude { get; set; }
    
    /// <summary>
    /// Cost of the activity
    /// </summary>
    public decimal Cost { get; set; }
    
    /// <summary>
    /// Activity category
    /// </summary>
    public string Category { get; set; } = string.Empty;
    
    /// <summary>
    /// Image URL
    /// </summary>
    public string ImageUrl { get; set; } = string.Empty;
    
    /// <summary>
    /// Rating out of 5
    /// </summary>
    public double Rating { get; set; }
    
    /// <summary>
    /// Phone number
    /// </summary>
    public string Phone { get; set; } = string.Empty;
    
    /// <summary>
    /// Website URL
    /// </summary>
    public string Website { get; set; } = string.Empty;
}

/// <summary>
/// Geoapify API response DTO
/// </summary>
public class GeoapifyResponse
{
    /// <summary>
    /// Response type
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// List of features
    /// </summary>
    public List<GeoapifyFeature> Features { get; set; } = new();
}

/// <summary>
/// Geoapify feature DTO
/// </summary>
public class GeoapifyFeature
{
    /// <summary>
    /// Feature type
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// Feature properties
    /// </summary>
    public GeoapifyProperties Properties { get; set; } = new();
    
    /// <summary>
    /// Feature geometry
    /// </summary>
    public GeoapifyGeometry Geometry { get; set; } = new();
}

/// <summary>
/// Geoapify properties DTO
/// </summary>
public class GeoapifyProperties
{
    /// <summary>
    /// Place name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Street address
    /// </summary>
    public string Street { get; set; } = string.Empty;
    
    /// <summary>
    /// City
    /// </summary>
    public string City { get; set; } = string.Empty;
    
    /// <summary>
    /// State
    /// </summary>
    public string State { get; set; } = string.Empty;
    
    /// <summary>
    /// Country
    /// </summary>
    public string Country { get; set; } = string.Empty;
    
    /// <summary>
    /// Postal code
    /// </summary>
    public string Postcode { get; set; } = string.Empty;
    
    /// <summary>
    /// Formatted address
    /// </summary>
    public string Formatted { get; set; } = string.Empty;
    
    /// <summary>
    /// Address line 1
    /// </summary>
    public string AddressLine1 { get; set; } = string.Empty;
    
    /// <summary>
    /// Address line 2
    /// </summary>
    public string AddressLine2 { get; set; } = string.Empty;
    
    /// <summary>
    /// Categories
    /// </summary>
    public List<string> Categories { get; set; } = new();
    
    /// <summary>
    /// Place identifier
    /// </summary>
    public string PlaceId { get; set; } = string.Empty;
    
    /// <summary>
    /// Latitude
    /// </summary>
    public double? Lat { get; set; }
    
    /// <summary>
    /// Longitude
    /// </summary>
    public double? Lon { get; set; }
    
    /// <summary>
    /// Phone number
    /// </summary>
    public string Phone { get; set; } = string.Empty;
    
    /// <summary>
    /// Website URL
    /// </summary>
    public string Website { get; set; } = string.Empty;
    
    /// <summary>
    /// Email address
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// Opening hours
    /// </summary>
    public string OpeningHours { get; set; } = string.Empty;
    
    /// <summary>
    /// Rating out of 5
    /// </summary>
    public double? Rating { get; set; }
    
    /// <summary>
    /// Number of reviews
    /// </summary>
    public int? Reviews { get; set; }
}

/// <summary>
/// Geoapify geometry DTO
/// </summary>
public class GeoapifyGeometry
{
    /// <summary>
    /// Geometry type
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// Coordinates [longitude, latitude]
    /// </summary>
    public double[] Coordinates { get; set; } = new double[2];
}

/// <summary>
/// City coordinates DTO
/// </summary>
public class CityCoordinates
{
    /// <summary>
    /// City name
    /// </summary>
    public string City { get; set; } = string.Empty;
    
    /// <summary>
    /// Latitude
    /// </summary>
    public double Lat { get; set; }
    
    /// <summary>
    /// Longitude
    /// </summary>
    public double Lon { get; set; }
}