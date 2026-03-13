using wanderSmart.Backend.DTOs;
using wanderSmart.Backend.Interfaces;
using wanderSmart.Backend.Models;
using wanderSmart.Backend.Models.Enums;
using wanderSmart.Backend.Services; 

namespace wanderSmart.Backend.Services;

public class ItineraryGenerationService : IItineraryGenerationService
{
    private readonly GeoapifyService _geoapifyService;
    private readonly IItineraryRepository _itineraryRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<ItineraryGenerationService> _logger;
    private readonly Random _random;

    public ItineraryGenerationService(
        GeoapifyService geoapifyService,
        IItineraryRepository itineraryRepository,
        IUserRepository userRepository,
        ILogger<ItineraryGenerationService> logger)
    {
        _geoapifyService = geoapifyService;
        _itineraryRepository = itineraryRepository;
        _userRepository = userRepository;
        _logger = logger;
        _random = new Random();
    }

    public async Task<GeneratedItineraryResponseDTO> GenerateItineraryAsync(GenerateItineraryRequestDTO request, string userId)
    {
        _logger.LogInformation("Generating itinerary for {Destination} with {PreferenceCount} preferences", 
            request.Destination, request.Preferences.Count);

        // 1. Calculate duration
        var duration = (request.EndDate - request.StartDate).Days + 1;
        
        // 2. Fetch real places from Geoapify
        var places = await _geoapifyService.GetPlacesByPreferencesAsync(request.Destination, request.Preferences, 150);
        
        if (!places.Any())
        {
            _logger.LogWarning("No places found for {Destination}, using fallback", request.Destination);
            places = GetFallbackPlaces(request.Destination);
        }
        
        // 3. Categorize places
        var categorized = CategorizePlaces(places);
        
        // 4. Generate day-wise itinerary
        var days = GenerateDays(request, categorized, duration);
        
        // 5. Calculate total cost
        var totalCost = days.Sum(d => d.DailyTotal);
        
        // 6. Create response
        var response = new GeneratedItineraryResponseDTO
        {
            Id = Guid.NewGuid().ToString(),
            Title = $"{request.Destination} {GetTravelStyle(request.Preferences)} Trip",
            Destination = request.Destination,
            Description = GetDescription(request.Destination, duration, request.Preferences),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Duration = duration,
            TotalBudget = Math.Max(totalCost, request.Budget),
            BudgetLevel = GetBudgetLevel(request.Budget),
            TravelStyle = GetTravelStyle(request.Preferences),
            Days = days,
            Tags = request.Preferences
        };
        
        return response;
    }

    private Dictionary<string, List<GeoapifyFeature>> CategorizePlaces(List<GeoapifyFeature> places)
    {
        var categorized = new Dictionary<string, List<GeoapifyFeature>>
        {
            ["restaurants"] = new List<GeoapifyFeature>(),
            ["cafes"] = new List<GeoapifyFeature>(),
            ["attractions"] = new List<GeoapifyFeature>(),
            ["museums"] = new List<GeoapifyFeature>(),
            ["parks"] = new List<GeoapifyFeature>(),
            ["shopping"] = new List<GeoapifyFeature>(),
            ["nightlife"] = new List<GeoapifyFeature>(),
            ["hotels"] = new List<GeoapifyFeature>(),
            ["beaches"] = new List<GeoapifyFeature>(),
            ["temples"] = new List<GeoapifyFeature>(),
            ["other"] = new List<GeoapifyFeature>()
        };
        
        foreach (var place in places)
        {
            var categories = place.Properties?.Categories ?? new List<string>();
            var catStr = string.Join(" ", categories).ToLower();
            var name = place.Properties?.Name?.ToLower() ?? "";
            
            if (catStr.Contains("restaurant") || catStr.Contains("food") || catStr.Contains("dining") || 
                (name.Contains("restaurant") && !name.Contains("cafe")) || name.Contains("biryani") || name.Contains("hotel") && !name.Contains("cafe"))
            {
                if (!catStr.Contains("cafe") && !name.Contains("cafe"))
                    categorized["restaurants"].Add(place);
            }
            else if (catStr.Contains("cafe") || catStr.Contains("coffee") || catStr.Contains("tea") || name.Contains("cafe") || name.Contains("coffee"))
            {
                categorized["cafes"].Add(place);
            }
            else if (catStr.Contains("museum") || catStr.Contains("gallery") || catStr.Contains("art"))
                categorized["museums"].Add(place);
            else if (catStr.Contains("park") || catStr.Contains("garden") || catStr.Contains("nature"))
                categorized["parks"].Add(place);
            else if (catStr.Contains("mall") || catStr.Contains("shop") || catStr.Contains("store") || catStr.Contains("commercial") || catStr.Contains("market"))
                categorized["shopping"].Add(place);
            else if (catStr.Contains("bar") || catStr.Contains("pub") || catStr.Contains("club") || catStr.Contains("night"))
                categorized["nightlife"].Add(place);
            else if (catStr.Contains("hotel") || catStr.Contains("accommodation") || catStr.Contains("resort"))
                categorized["hotels"].Add(place);
            else if (catStr.Contains("beach") || catStr.Contains("coast") || name.Contains("beach"))
                categorized["beaches"].Add(place);
            else if (catStr.Contains("temple") || catStr.Contains("religion") || catStr.Contains("church") || catStr.Contains("mosque") || name.Contains("temple"))
                categorized["temples"].Add(place);
            else if (catStr.Contains("attraction") || catStr.Contains("tourism") || catStr.Contains("sight") || catStr.Contains("monument") || catStr.Contains("fort") || catStr.Contains("palace"))
                categorized["attractions"].Add(place);
            else
                categorized["other"].Add(place);
        }
        
        foreach (var key in categorized.Keys.ToList())
        {
            categorized[key] = categorized[key]
                .GroupBy(p => p.Properties.PlaceId)
                .Select(g => g.First())
                .ToList();
        }
        
        foreach (var kvp in categorized)
        {
            _logger.LogDebug("Category {Category}: {Count} unique places", kvp.Key, kvp.Value.Count);
        }
        
        return categorized;
    }

    private List<GeneratedDayPlanDTO> GenerateDays(
        GenerateItineraryRequestDTO request,
        Dictionary<string, List<GeoapifyFeature>> categorized,
        int days)
    {
        var itineraryDays = new List<GeneratedDayPlanDTO>();
        var usedPlaceIds = new HashSet<string>();
        
        var breakfastPlaces = new Queue<GeoapifyFeature>();
        var lunchPlaces = new Queue<GeoapifyFeature>();
        var dinnerPlaces = new Queue<GeoapifyFeature>();
        var attractionPlaces = new Queue<GeoapifyFeature>();
        var shoppingPlaces = new Queue<GeoapifyFeature>();
        
        InitializeQueues(categorized, breakfastPlaces, lunchPlaces, dinnerPlaces, attractionPlaces, shoppingPlaces, usedPlaceIds);
        
        for (int i = 0; i < days; i++)
        {
            var currentDate = request.StartDate.AddDays(i);
            var dayActivities = new List<GeneratedActivityDTO>();
            decimal dailyTotal = 0;
            
            if (breakfastPlaces.Any())
            {
                var breakfast = breakfastPlaces.Dequeue();
                var activity = CreateActivityFromPlace(breakfast, "Breakfast", "09:00", "10:30");
                activity.Cost = GetMealCost("breakfast", request.Budget);
                activity.Description = $"Start your day with breakfast at {breakfast.Properties.Name}";
                dailyTotal += activity.Cost;
                dayActivities.Add(activity);
            }
            
            if (attractionPlaces.Any())
            {
                var attraction = attractionPlaces.Dequeue();
                var activity = CreateActivityFromPlace(attraction, "Morning Exploration", "11:00", "13:00");
                activity.Cost = GetAttractionCost(request.Budget);
                dailyTotal += activity.Cost;
                dayActivities.Add(activity);
            }
            
            if (lunchPlaces.Any())
            {
                var lunch = lunchPlaces.Dequeue();
                var activity = CreateActivityFromPlace(lunch, "Lunch", "13:30", "15:00");
                activity.Cost = GetMealCost("lunch", request.Budget);
                activity.Description = $"Enjoy lunch at {lunch.Properties.Name}";
                dailyTotal += activity.Cost;
                dayActivities.Add(activity);
            }
            
            if (shoppingPlaces.Any())
            {
                var shopping = shoppingPlaces.Dequeue();
                var activity = CreateActivityFromPlace(shopping, "Afternoon Activity", "15:30", "17:30");
                activity.Cost = GetActivityCost(request.Budget);
                dailyTotal += activity.Cost;
                dayActivities.Add(activity);
            }
            else if (attractionPlaces.Any())
            {
                var attraction = attractionPlaces.Dequeue();
                var activity = CreateActivityFromPlace(attraction, "Afternoon Exploration", "15:30", "17:30");
                activity.Cost = GetActivityCost(request.Budget);
                dailyTotal += activity.Cost;
                dayActivities.Add(activity);
            }
            
            if (dinnerPlaces.Any())
            {
                var dinner = dinnerPlaces.Dequeue();
                var activity = CreateActivityFromPlace(dinner, "Dinner", "19:00", "21:00");
                activity.Cost = GetMealCost("dinner", request.Budget);
                activity.Description = $"Enjoy dinner at {dinner.Properties.Name}";
                dailyTotal += activity.Cost;
                dayActivities.Add(activity);
            }
            
            if (request.Preferences.Contains("Nightlife") && i < days - 1 && categorized["nightlife"].Any())
            {
                var nightlife = GetUnusedPlace(categorized["nightlife"], usedPlaceIds);
                if (nightlife != null)
                {
                    var activity = CreateActivityFromPlace(nightlife, "Evening Entertainment", "21:30", "23:30");
                    activity.Cost = GetNightlifeCost(request.Budget);
                    dailyTotal += activity.Cost;
                    dayActivities.Add(activity);
                }
            }
            
            dayActivities = dayActivities.OrderBy(a => TimeSpan.Parse(a.StartTime)).ToList();
            
            var theme = GetThemeForDay(i, request.Preferences);
            
            itineraryDays.Add(new GeneratedDayPlanDTO
            {
                DayNumber = i + 1,
                Date = currentDate,
                Theme = theme,
                Activities = dayActivities,
                Notes = $"Day {i + 1} in {request.Destination}. Total estimated cost: ₹{dailyTotal:N0}",
                DailyTotal = dailyTotal
            });
        }
        
        return itineraryDays;
    }

    private void InitializeQueues(
        Dictionary<string, List<GeoapifyFeature>> categorized,
        Queue<GeoapifyFeature> breakfastPlaces,
        Queue<GeoapifyFeature> lunchPlaces,
        Queue<GeoapifyFeature> dinnerPlaces,
        Queue<GeoapifyFeature> attractionPlaces,
        Queue<GeoapifyFeature> shoppingPlaces,
        HashSet<string> usedPlaceIds)
    {
        var cafes = categorized["cafes"]
            .OrderBy(x => _random.Next())
            .Take(3)
            .ToList();
        foreach (var cafe in cafes)
        {
            breakfastPlaces.Enqueue(cafe);
            usedPlaceIds.Add(cafe.Properties.PlaceId);
        }
        
        var lunchRestaurants = categorized["restaurants"]
            .Where(r => !usedPlaceIds.Contains(r.Properties.PlaceId))
            .OrderBy(x => _random.Next())
            .Take(5)
            .ToList();
        foreach (var restaurant in lunchRestaurants)
        {
            lunchPlaces.Enqueue(restaurant);
            usedPlaceIds.Add(restaurant.Properties.PlaceId);
        }
        
        var dinnerRestaurants = categorized["restaurants"]
            .Where(r => !usedPlaceIds.Contains(r.Properties.PlaceId))
            .OrderBy(x => _random.Next())
            .Take(5)
            .ToList();
        foreach (var restaurant in dinnerRestaurants)
        {
            dinnerPlaces.Enqueue(restaurant);
            usedPlaceIds.Add(restaurant.Properties.PlaceId);
        }
        
        var allAttractions = new List<GeoapifyFeature>();
        allAttractions.AddRange(categorized["attractions"]);
        allAttractions.AddRange(categorized["museums"]);
        allAttractions.AddRange(categorized["parks"]);
        allAttractions.AddRange(categorized["temples"]);
        allAttractions.AddRange(categorized["beaches"]);
        
        var shuffledAttractions = allAttractions
            .Where(a => !usedPlaceIds.Contains(a.Properties.PlaceId))
            .DistinctBy(a => a.Properties.PlaceId)
            .OrderBy(x => _random.Next())
            .Take(8)
            .ToList();
        
        foreach (var attraction in shuffledAttractions)
        {
            attractionPlaces.Enqueue(attraction);
            usedPlaceIds.Add(attraction.Properties.PlaceId);
        }
        
        var shopping = categorized["shopping"]
            .Where(s => !usedPlaceIds.Contains(s.Properties.PlaceId))
            .OrderBy(x => _random.Next())
            .Take(4)
            .ToList();
        foreach (var shop in shopping)
        {
            shoppingPlaces.Enqueue(shop);
            usedPlaceIds.Add(shop.Properties.PlaceId);
        }
    }

    private GeoapifyFeature? GetUnusedPlace(List<GeoapifyFeature> places, HashSet<string> usedPlaceIds)
    {
        var available = places.Where(p => !usedPlaceIds.Contains(p.Properties.PlaceId)).ToList();
        if (!available.Any()) return null;
        
        var selected = available[_random.Next(available.Count)];
        usedPlaceIds.Add(selected.Properties.PlaceId);
        return selected;
    }

    private GeneratedActivityDTO CreateActivityFromPlace(GeoapifyFeature place, string defaultName, string startTime, string endTime)
    {
        var props = place.Properties;
        var coords = place.Geometry?.Coordinates ?? new double[] { 0, 0 };
        
        return new GeneratedActivityDTO
        {
            Name = !string.IsNullOrEmpty(props.Name) ? props.Name : defaultName,
            Description = GetActivityDescription(props.Categories, props.Name),
            StartTime = startTime,
            EndTime = endTime,
            Location = props.Name ?? defaultName,
            Address = props.Formatted ?? props.AddressLine1 ?? "Address not available",
            Latitude = coords.Length > 1 ? coords[1] : props.Lat ?? 0,
            Longitude = coords.Length > 0 ? coords[0] : props.Lon ?? 0,
            Cost = 0,
            Category = GetCategoryFromPlace(props.Categories),
            Rating = props.Rating ?? 4.0,
            Phone = props.Phone ?? string.Empty,
            Website = props.Website ?? string.Empty
        };
    }

    private GeneratedActivityDTO CreateGenericActivity(string name, string description, string startTime, string endTime, decimal cost, string category)
    {
        return new GeneratedActivityDTO
        {
            Name = name,
            Description = description,
            StartTime = startTime,
            EndTime = endTime,
            Location = name,
            Address = "Location not available",
            Latitude = 0,
            Longitude = 0,
            Cost = cost,
            Category = category,
            Rating = 4.0,
            Phone = string.Empty,
            Website = string.Empty
        };
    }

    private string GetCategoryFromPlace(List<string>? categories)
    {
        if (categories == null || !categories.Any())
            return "Attraction";
            
        var catStr = string.Join(" ", categories).ToLower();
        
        if (catStr.Contains("restaurant")) return "Restaurant";
        if (catStr.Contains("cafe")) return "Cafe";
        if (catStr.Contains("museum")) return "Museum";
        if (catStr.Contains("park")) return "Park";
        if (catStr.Contains("mall") || catStr.Contains("shop")) return "Shopping";
        if (catStr.Contains("bar") || catStr.Contains("pub")) return "Bar";
        if (catStr.Contains("beach")) return "Beach";
        if (catStr.Contains("temple") || catStr.Contains("religion")) return "Temple";
        if (catStr.Contains("hotel")) return "Hotel";
        
        return "Attraction";
    }

    private decimal GetMealCost(string mealType, decimal totalBudget)
    {
        return mealType switch
        {
            "breakfast" => Math.Round(totalBudget * 0.05m),
            "lunch" => Math.Round(totalBudget * 0.08m),
            "dinner" => Math.Round(totalBudget * 0.12m),
            _ => 500
        };
    }

    private decimal GetAttractionCost(decimal totalBudget) => Math.Round(totalBudget * 0.03m);
    private decimal GetActivityCost(decimal totalBudget) => Math.Round(totalBudget * 0.04m);
    private decimal GetNightlifeCost(decimal totalBudget) => Math.Round(totalBudget * 0.1m);

    private string GetThemeForDay(int dayIndex, List<string> preferences)
    {
        var themes = new[]
        {
            "Arrival & Local Exploration",
            "Cultural Immersion",
            "Adventure & Nature",
            "Food & Shopping",
            "Relaxation & Leisure",
            "Heritage Tour",
            "Local Experiences",
            "Scenic Beauty"
        };
        
        if (preferences.Any())
        {
            var pref = preferences[dayIndex % preferences.Count];
            return $"{pref} Experience";
        }
        
        return themes[dayIndex % themes.Length];
    }

    private string GetTravelStyle(List<string> preferences)
    {
        if (preferences.Contains("Adventure")) return "Adventure";
        if (preferences.Contains("Relaxation")) return "Relaxation";
        if (preferences.Contains("Cultural")) return "Cultural";
        if (preferences.Contains("Food")) return "Foodie";
        if (preferences.Contains("Shopping")) return "Shopping";
        if (preferences.Contains("Nightlife")) return "Nightlife";
        return "Balanced";
    }

    private string GetBudgetLevel(decimal budget)
    {
        return budget switch
        {
            <= 10000 => "Budget",
            <= 30000 => "Medium",
            <= 70000 => "High",
            _ => "Luxury"
        };
    }

    private string GetDescription(string destination, int days, List<string> preferences)
    {
        var prefStr = preferences.Any() 
            ? string.Join(", ", preferences.Take(2)) 
            : "amazing";
            
        return $"Explore the beautiful city of {destination} with this {days}-day {prefStr} itinerary.";
    }

    private string GetActivityDescription(List<string>? categories, string name)
    {
        if (categories == null || !categories.Any())
            return $"Experience {name}";
            
        var category = categories.First().Split('.').Last();
        
        return category switch
        {
            "restaurant" => $"Enjoy authentic cuisine at {name}",
            "cafe" => $"Relax with coffee and snacks at {name}",
            "museum" => $"Explore fascinating exhibits at {name}",
            "attraction" => $"Discover the beauty of {name}",
            "park" => $"Take a relaxing stroll through {name}",
            "shopping_mall" => $"Shop at {name} for the best deals",
            "bar" => $"Unwind with drinks at {name}",
            "hotel" => $"Experience hospitality at {name}",
            "beach" => $"Relax by the shore at {name}",
            _ => $"Visit {name}"
        };
    }

    private List<GeoapifyFeature> GetFallbackPlaces(string destination)
    {
        var mockPlaces = new List<GeoapifyFeature>();
        
        var mockData = new Dictionary<string, List<(string name, string category, string address, double lat, double lon)>>
        {
            ["Mumbai"] = new List<(string, string, string, double, double)>
            {
                ("Gateway of India", "tourism.attraction", "Apollo Bandar, Colaba", 18.9220, 72.8347),
                ("Marine Drive", "leisure.park", "Marine Lines", 18.9440, 72.8230),
                ("Leopold Cafe", "catering.cafe", "Colaba", 18.9228, 72.8324),
                ("Taj Mahal Palace", "accommodation.hotel", "Colaba", 18.9218, 72.8335)
            },
            ["Delhi"] = new List<(string, string, string, double, double)>
            {
                ("India Gate", "tourism.attraction", "Rajpath", 28.6129, 77.2295),
                ("Qutub Minar", "tourism.attraction", "Mehrauli", 28.5245, 77.1855),
                ("Karims", "catering.restaurant", "Jama Masjid", 28.6497, 77.2333),
                ("Red Fort", "tourism.attraction", "Old Delhi", 28.6562, 77.2410)
            },
            ["Hyderabad"] = new List<(string, string, string, double, double)>
            {
                ("Charminar", "tourism.attraction", "Old City", 17.3616, 78.4747),
                ("Golconda Fort", "tourism.attraction", "Golconda", 17.3833, 78.4011),
                ("Paradise Biryani", "catering.restaurant", "Secunderabad", 17.4358, 78.4971),
                ("Hussain Sagar Lake", "leisure.park", "Hyderabad", 17.4156, 78.4847)
            },
            ["Chennai"] = new List<(string, string, string, double, double)>
            {
                ("Marina Beach", "leisure.beach", "Marina Beach", 13.0500, 80.2824),
                ("Kapaleeshwarar Temple", "religion.hindu", "Mylapore", 13.0337, 80.2695),
                ("Murugan Idli Shop", "catering.restaurant", "T Nagar", 13.0419, 80.2345),
                ("Fort St. George", "tourism.attraction", "George Town", 13.0797, 80.2870)
            },
            ["Kolkata"] = new List<(string, string, string, double, double)>
            {
                ("Victoria Memorial", "tourism.museum", "Maidan", 22.5448, 88.3426),
                ("Howrah Bridge", "tourism.attraction", "Howrah", 22.5851, 88.3468),
                ("Indian Museum", "entertainment.museum", "Park Street", 22.5578, 88.3505),
                ("Park Street", "catering.restaurant", "Park Street", 22.5557, 88.3508)
            }
        };

        if (mockData.ContainsKey(destination))
        {
            foreach (var item in mockData[destination])
            {
                mockPlaces.Add(new GeoapifyFeature
                {
                    Properties = new GeoapifyProperties
                    {
                        Name = item.name,
                        Categories = new List<string> { item.category },
                        Formatted = item.address,
                        AddressLine1 = item.address,
                        PlaceId = $"mock-{Guid.NewGuid()}",
                        Rating = 4.5,
                        Lat = item.lat,
                        Lon = item.lon
                    },
                    Geometry = new GeoapifyGeometry
                    {
                        Coordinates = new double[] { item.lon, item.lat }
                    }
                });
            }
        }
        
        return mockPlaces;
    }
}