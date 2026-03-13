using System.Text.Json;
using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Services;

public class GeoapifyService 
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeoapifyService> _logger;
    private readonly Dictionary<string, CityCoordinates> _cityCoordinatesCache;

    public GeoapifyService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<GeoapifyService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        
        // Initialize with major Indian cities
        _cityCoordinatesCache = new Dictionary<string, CityCoordinates>
        {
            ["Mumbai"] = new CityCoordinates { City = "Mumbai", Lat = 19.0760, Lon = 72.8777 },
            ["Delhi"] = new CityCoordinates { City = "Delhi", Lat = 28.6139, Lon = 77.2090 },
            ["Bangalore"] = new CityCoordinates { City = "Bangalore", Lat = 12.9716, Lon = 77.5946 },
            ["Chennai"] = new CityCoordinates { City = "Chennai", Lat = 13.0827, Lon = 80.2707 },
            ["Kolkata"] = new CityCoordinates { City = "Kolkata", Lat = 22.5726, Lon = 88.3639 },
            ["Hyderabad"] = new CityCoordinates { City = "Hyderabad", Lat = 17.3850, Lon = 78.4867 },
            ["Jaipur"] = new CityCoordinates { City = "Jaipur", Lat = 26.9124, Lon = 75.7873 },
            ["Goa"] = new CityCoordinates { City = "Goa", Lat = 15.2993, Lon = 74.1240 },
            ["Ahmedabad"] = new CityCoordinates { City = "Ahmedabad", Lat = 23.0225, Lon = 72.5714 },
            ["Pune"] = new CityCoordinates { City = "Pune", Lat = 18.5204, Lon = 73.8567 },
            ["Lucknow"] = new CityCoordinates { City = "Lucknow", Lat = 26.8467, Lon = 80.9462 },
            ["Agra"] = new CityCoordinates { City = "Agra", Lat = 27.1767, Lon = 78.0081 },
            ["Varanasi"] = new CityCoordinates { City = "Varanasi", Lat = 25.3176, Lon = 82.9739 },
            ["Udaipur"] = new CityCoordinates { City = "Udaipur", Lat = 24.5854, Lon = 73.7125 },
            ["Amritsar"] = new CityCoordinates { City = "Amritsar", Lat = 31.6340, Lon = 74.8723 }
        };
    }

    public async Task<List<GeoapifyFeature>> GetPlacesByCityAsync(string city, string? category = null, int limit = 50)
    {
        var coordinates = await GetCityCoordinatesAsync(city);
        if (coordinates == null)
        {
            _logger.LogWarning("Could not find coordinates for city: {City}", city);
            return new List<GeoapifyFeature>();
        }

        _logger.LogInformation("Getting places for city: {City} at coordinates {Lat}, {Lon}", city, coordinates.Lat, coordinates.Lon);
        return await GetPlacesByCoordinatesAsync(coordinates.Lat, coordinates.Lon, category, 5000, limit);
    }

    public async Task<List<GeoapifyFeature>> GetPlacesByCoordinatesAsync(double lat, double lon, string? category = null, int radius = 5000, int limit = 50)
    {
        try
        {
            var apiKey = _configuration["Geoapify:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("Geoapify API key is not configured");
                return new List<GeoapifyFeature>();
            }

            var categories = category ?? "catering,commercial,tourism,entertainment,leisure,accommodation";
            var url = $"https://api.geoapify.com/v2/places?categories={categories}&filter=circle:{lon},{lat},{radius}&limit={limit}&apiKey={apiKey}";
            
            _logger.LogInformation("Fetching places from Geoapify for category: {Category}", categories);
            
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Geoapify API returned error: {StatusCode}", response.StatusCode);
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error details: {Error}", errorContent);
                return new List<GeoapifyFeature>();
            }
            
            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GeoapifyResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            var places = result?.Features ?? new List<GeoapifyFeature>();
            
            // Ensure each place has a unique identifier
            foreach (var place in places)
            {
                if (place.Properties == null)
                {
                    place.Properties = new GeoapifyProperties();
                }
                
                // Create a unique ID if PlaceId is missing
                if (string.IsNullOrEmpty(place.Properties.PlaceId))
                {
                    var name = place.Properties.Name ?? "unknown";
                    var latVal = place.Geometry?.Coordinates?.Length > 1 ? place.Geometry.Coordinates[1] : lat;
                    var lonVal = place.Geometry?.Coordinates?.Length > 0 ? place.Geometry.Coordinates[0] : lon;
                    place.Properties.PlaceId = $"{name}-{latVal}-{lonVal}-{Guid.NewGuid()}";
                }
            }
            
            _logger.LogInformation("Found {Count} places for category {Category}", places.Count, categories);
            
            return places;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching places from Geoapify");
            return new List<GeoapifyFeature>();
        }
    }

    public async Task<List<GeoapifyFeature>> GetPlacesByPreferencesAsync(string city, List<string> preferences, int limit = 100)
    {
        var coordinates = await GetCityCoordinatesAsync(city);
        if (coordinates == null)
        {
            _logger.LogWarning("Could not find coordinates for city: {City}", city);
            return new List<GeoapifyFeature>();
        }

        _logger.LogInformation("Getting places for {City} based on preferences: {Preferences}", city, string.Join(", ", preferences));

        var allPlaces = new List<GeoapifyFeature>();
        var categories = MapPreferencesToCategories(preferences);
        
        _logger.LogInformation("Mapped preferences to categories: {Categories}", string.Join(", ", categories));
        
        foreach (var category in categories)
        {
            _logger.LogDebug("Fetching category: {Category}", category);
            var places = await GetPlacesByCoordinatesAsync(coordinates.Lat, coordinates.Lon, category, 5000, 20);
            _logger.LogDebug("Found {Count} places for category {Category}", places.Count, category);
            allPlaces.AddRange(places);
        }
        
        _logger.LogInformation("Total places before deduplication: {Count}", allPlaces.Count);
        
        // Improved deduplication - use multiple fields to ensure uniqueness
        var uniquePlaces = allPlaces
            .GroupBy(p => new { 
                Id = p.Properties?.PlaceId ?? "no-id",
                Name = p.Properties?.Name ?? "unknown",
                Lat = p.Geometry?.Coordinates?.Length > 1 ? p.Geometry.Coordinates[1] : 0,
                Lon = p.Geometry?.Coordinates?.Length > 0 ? p.Geometry.Coordinates[0] : 0
            })
            .Select(g => g.First())
            .ToList();
        
        _logger.LogInformation("Unique places after deduplication: {Count}", uniquePlaces.Count);
        
        // Log category breakdown
        var restaurantCount = uniquePlaces.Count(p => p.Properties?.Categories?.Any(c => c.Contains("restaurant")) == true);
        var cafeCount = uniquePlaces.Count(p => p.Properties?.Categories?.Any(c => c.Contains("cafe")) == true);
        var attractionCount = uniquePlaces.Count(p => p.Properties?.Categories?.Any(c => c.Contains("attraction") || c.Contains("tourism")) == true);
        var shoppingCount = uniquePlaces.Count(p => p.Properties?.Categories?.Any(c => c.Contains("commercial") || c.Contains("mall")) == true);
        
        _logger.LogInformation("Category breakdown for {City}: Restaurants: {R}, Cafes: {C}, Attractions: {A}, Shopping: {S}", 
            city, restaurantCount, cafeCount, attractionCount, shoppingCount);
        
        // If we got very few places, log a warning
        if (uniquePlaces.Count < 10)
        {
            _logger.LogWarning("Very few unique places found for {City}! Only {Count} places total.", city, uniquePlaces.Count);
        }
        
        return uniquePlaces.Take(limit).ToList();
    }

    public async Task<CityCoordinates?> GetCityCoordinatesAsync(string city)
    {
        // Check cache first
        if (_cityCoordinatesCache.TryGetValue(city, out var cachedCoords))
        {
            _logger.LogDebug("Using cached coordinates for {City}: {Lat}, {Lon}", city, cachedCoords.Lat, cachedCoords.Lon);
            return cachedCoords;
        }

        try
        {
            var apiKey = _configuration["Geoapify:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("Geoapify API key is not configured");
                return null;
            }

            _logger.LogInformation("Geocoding city: {City}", city);
            var url = $"https://api.geoapify.com/v1/geocode/search?text={city}&format=json&apiKey={apiKey}";
            
            var response = await _httpClient.GetAsync(url);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Geocoding API returned error: {StatusCode}", response.StatusCode);
                return null;
            }
            
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            
            if (root.TryGetProperty("results", out var results) && results.GetArrayLength() > 0)
            {
                var first = results[0];
                var lat = first.GetProperty("lat").GetDouble();
                var lon = first.GetProperty("lon").GetDouble();
                
                _logger.LogInformation("Geocoded {City} to coordinates: {Lat}, {Lon}", city, lat, lon);
                
                var coords = new CityCoordinates { City = city, Lat = lat, Lon = lon };
                _cityCoordinatesCache[city] = coords;
                return coords;
            }
            else
            {
                _logger.LogWarning("No results found for city: {City}", city);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error geocoding city: {City}", city);
        }
        
        return null;
    }

    public async Task<byte[]?> GetPlaceImageAsync(string placeId)
    {
        try
        {
            var apiKey = _configuration["Geoapify:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return null;

            var url = $"https://api.geoapify.com/v2/place-details?id={placeId}&apiKey={apiKey}";
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching place image");
            return null;
        }
    }

    private List<string> MapPreferencesToCategories(List<string> preferences)
    {
        var categories = new List<string>();
        
        foreach (var pref in preferences.Select(p => p.ToLower()))
        {
            switch (pref)
            {
                case "food":
                    categories.Add("catering.restaurant");
                    categories.Add("catering.cafe");
                    categories.Add("catering.fast_food");
                    break;
                case "adventure":
                    categories.Add("tourism.attraction");
                    categories.Add("leisure");
                    categories.Add("sport");
                    break;
                case "cultural":
                    categories.Add("tourism.attraction");
                    categories.Add("entertainment.museum");
                    categories.Add("tourism.sights");
                    categories.Add("religion");
                    break;
                case "shopping":
                    categories.Add("commercial");
                    categories.Add("commercial.shopping_mall");
                    categories.Add("commercial.market");
                    break;
                case "relaxation":
                    categories.Add("leisure.park");
                    categories.Add("leisure.spa");
                    categories.Add("leisure.wellness");
                    categories.Add("beach");
                    break;
                case "nightlife":
                    categories.Add("catering.bar");
                    categories.Add("catering.pub");
                    categories.Add("entertainment.nightclub");
                    break;
                case "heritage":
                    categories.Add("tourism.attraction");
                    categories.Add("tourism.sights");
                    categories.Add("historic");
                    categories.Add("religion");
                    break;
                case "nature":
                    categories.Add("leisure.park");
                    categories.Add("leisure.garden");
                    categories.Add("national_park");
                    categories.Add("beach");
                    break;
                default:
                    categories.Add("catering.restaurant");
                    categories.Add("tourism.attraction");
                    break;
            }
        }
        
        var distinctCategories = categories.Distinct().ToList();
        _logger.LogDebug("Mapped preferences {Preferences} to categories: {Categories}", 
            string.Join(", ", preferences), string.Join(", ", distinctCategories));
        
        return distinctCategories;
    }
}