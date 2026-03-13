using System.ComponentModel.DataAnnotations;

namespace wanderSmart.Backend.DTOs;

/// <summary>
/// Complete city details response
/// </summary>
public class CityDetailsResponseDTO
{
    /// <summary>
    /// City name
    /// </summary>
    public string City { get; set; } = string.Empty;
    
    /// <summary>
    /// State name
    /// </summary>
    public string State { get; set; } = string.Empty;
    
    /// <summary>
    /// Hero image URL for the city
    /// </summary>
    public string HeroImage { get; set; } = string.Empty;
    
    /// <summary>
    /// List of tourist attractions
    /// </summary>
    public List<AttractionDTO> Attractions { get; set; } = new();
    
    /// <summary>
    /// List of local food items
    /// </summary>
    public List<FoodItemDTO> Food { get; set; } = new();
    
    /// <summary>
    /// Transport options available
    /// </summary>
    public List<TransportOptionDTO> Transport { get; set; } = new();
    
    /// <summary>
    /// City statistics
    /// </summary>
    public CityStatsDTO Stats { get; set; } = new();
    
    /// <summary>
    /// Suggested itineraries
    /// </summary>
    public List<ItinerarySuggestionDTO> Itinerary { get; set; } = new();
}

/// <summary>
/// Tourist attraction details
/// </summary>
public class AttractionDTO
{
    /// <summary>
    /// Attraction name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Category (Landmark, Heritage, Nature, etc.)
    /// </summary>
    public string Category { get; set; } = string.Empty;
    
    /// <summary>
    /// Detailed description
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Time needed to visit
    /// </summary>
    public string Time { get; set; } = string.Empty;
    
    /// <summary>
    /// Entry price
    /// </summary>
    public string Price { get; set; } = string.Empty;
    
    /// <summary>
    /// Image URL
    /// </summary>
    public string Image { get; set; } = string.Empty;
    
    /// <summary>
    /// Rating out of 5
    /// </summary>
    public string Rating { get; set; } = string.Empty;
    
    /// <summary>
    /// Latitude coordinate
    /// </summary>
    public string? Latitude { get; set; }
    
    /// <summary>
    /// Longitude coordinate
    /// </summary>
    public string? Longitude { get; set; }
}

/// <summary>
/// Local food item details
/// </summary>
public class FoodItemDTO
{
    /// <summary>
    /// Food item name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Description of the dish
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Approximate price
    /// </summary>
    public string Price { get; set; } = string.Empty;
    
    /// <summary>
    /// Food image URL
    /// </summary>
    public string Image { get; set; } = string.Empty;
    
    /// <summary>
    /// Cuisine type
    /// </summary>
    public string Cuisine { get; set; } = string.Empty;
    
    /// <summary>
    /// Rating out of 5
    /// </summary>
    public string Rating { get; set; } = string.Empty;
}

/// <summary>
/// Transport option details
/// </summary>
public class TransportOptionDTO
{
    /// <summary>
    /// Transport type (train, bus, taxi, etc.)
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// Transport service name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Description of the transport option
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// Price range
    /// </summary>
    public string Price { get; set; } = string.Empty;
}

/// <summary>
/// City statistics
/// </summary>
public class CityStatsDTO
{
    /// <summary>
    /// Number of attractions
    /// </summary>
    public int Attractions { get; set; }
    
    /// <summary>
    /// Number of hotels
    /// </summary>
    public int Hotels { get; set; }
    
    /// <summary>
    /// Number of food options
    /// </summary>
    public int Food { get; set; }
}

/// <summary>
/// Suggested itinerary
/// </summary>
public class ItinerarySuggestionDTO
{
    /// <summary>
    /// Itinerary title
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// List of activities in the itinerary
    /// </summary>
    public List<ActivityItemDTO> Activities { get; set; } = new();
}

/// <summary>
/// Individual activity in an itinerary
/// </summary>
public class ActivityItemDTO
{
    /// <summary>
    /// Time of the activity
    /// </summary>
    public string Time { get; set; } = string.Empty;
    
    /// <summary>
    /// Activity type (visit, food, travel, etc.)
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// Activity description
    /// </summary>
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// City image response
/// </summary>
public class CityImageResponseDTO
{
    /// <summary>
    /// Unique identifier for the image
    /// </summary>
    public string Id { get; set; } = string.Empty;
    
    /// <summary>
    /// Description or alt text for the image
    /// </summary>
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// High-resolution image URL
    /// </summary>
    public string Url { get; set; } = string.Empty;
    
    /// <summary>
    /// Thumbnail image URL for previews
    /// </summary>
    public string Thumbnail { get; set; } = string.Empty;
    
    /// <summary>
    /// Name of the photographer
    /// </summary>
    public string Photographer { get; set; } = string.Empty;
    
    /// <summary>
    /// Link to photographer's Unsplash profile
    /// </summary>
    public string PhotographerLink { get; set; } = string.Empty;
    
    /// <summary>
    /// Link to the image on Unsplash
    /// </summary>
    public string Link { get; set; } = string.Empty;
}

/// <summary>
/// Destination image response
/// </summary>
public class DestinationImageResponseDTO
{
    /// <summary>
    /// Name of the city or destination
    /// </summary>
    public string City { get; set; } = string.Empty;
    
    /// <summary>
    /// List of images for the destination
    /// </summary>
    public List<object> Images { get; set; } = new();
}

/// <summary>
/// Metro city information
/// </summary>
public class MetroCityDTO
{
    /// <summary>
    /// City name
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// State name
    /// </summary>
    public string State { get; set; } = string.Empty;
    
    /// <summary>
    /// City code for API calls
    /// </summary>
    public string Code { get; set; } = string.Empty;
}