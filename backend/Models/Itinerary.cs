using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using wanderSmart.Backend.Models.Enums;

namespace wanderSmart.Backend.Models;

public class Itinerary
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    
    public string UserId { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Destination { get; set; } = null!;
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TotalBudget { get; set; }
    
    public BudgetLevel BudgetLevel { get; set; }
    public TravelStyle TravelStyle { get; set; }
    
    public List<DayPlan> Days { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    
    public bool IsPublic { get; set; } = false;
    public int Views { get; set; } = 0;
    public int Likes { get; set; } = 0;
    public List<string> LikedBy { get; set; } = new();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class DayPlan
{
    public int DayNumber { get; set; }
    public DateTime Date { get; set; }
    public string? Theme { get; set; }
    public List<Activity> Activities { get; set; } = new();
    public string? Notes { get; set; }
}

public class Activity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
    
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Location { get; set; } = null!;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal Cost { get; set; }
    
    public ActivityCategory Category { get; set; }
    public string? ImageUrl { get; set; }
    public string? BookingUrl { get; set; }
    public bool IsBooked { get; set; } = false;
    public string? BookingReference { get; set; }
}