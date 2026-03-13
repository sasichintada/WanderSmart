using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Configuration;
using System.Linq;
using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Services
{
    public class CityDataService
    {
        private readonly HttpClient _httpClient;
        private readonly string _pexelsKey;
        private readonly string _foursquareKey;

        public CityDataService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _pexelsKey = configuration["Pexels:ApiKey"] ?? throw new InvalidOperationException("Pexels API key not configured");
            _foursquareKey = configuration["Foursquare:ApiKey"] ?? throw new InvalidOperationException("Foursquare API key not configured");
        }

        // Get complete city details for 6 metro cities
        public async Task<object> GetCityDetails(string city, string state)
        {
            var cityLower = city.ToLower();
            
            var cityData = new
            {
                City = city,
                State = state,
                HeroImage = await GetCityHeroImage(cityLower),
                Attractions = await GetAttractions(city, state),
                Food = await GetLocalFood(city),
                Transport = GetTransportOptions(cityLower),
                Stats = GetCityStats(cityLower),
                Itinerary = GetSuggestedItinerary(cityLower)
            };

            return cityData;
        }

        // Get hero image from Pexels
        private async Task<string> GetCityHeroImage(string city)
        {
            try
            {
                var searchQueries = new Dictionary<string, string>
                {
                    { "mumbai", "Mumbai Gateway of India" },
                    { "delhi", "Delhi India Gate" },
                    { "bangalore", "Bangalore Vidhana Soudha" },
                    { "chennai", "Chennai Marina Beach" },
                    { "kolkata", "Kolkata Howrah Bridge" },
                    { "hyderabad", "Hyderabad Charminar" }
                };

                var query = searchQueries.ContainsKey(city) ? searchQueries[city] : $"{city} India landmark";
                
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Get,
                    RequestUri = new Uri($"https://api.pexels.com/v1/search?query={Uri.EscapeDataString(query)}&per_page=1&orientation=landscape")
                };
                
                request.Headers.Add("Authorization", _pexelsKey);

                using var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var body = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(body);
                
                var photoUrl = data["photos"]?[0]?["src"]?["large2x"]?.ToString();
                
                if (!string.IsNullOrEmpty(photoUrl))
                    return photoUrl;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Pexels API error: {ex.Message}");
            }

            // Fallback images
            var fallbacks = new Dictionary<string, string>
            {
                { "mumbai", "https://images.pexels.com/photos/3704719/pexels-photo-3704719.jpeg" },
                { "delhi", "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg" },
                { "bangalore", "https://images.pexels.com/photos/9395600/pexels-photo-9395600.jpeg" },
                { "chennai", "https://images.pexels.com/photos/5560362/pexels-photo-5560362.jpeg" },
                { "kolkata", "https://images.pexels.com/photos/5560362/pexels-photo-5560362.jpeg" },
                { "hyderabad", "https://images.pexels.com/photos/26699043/pexels-photo-26699043/free-photo-of-charminar-in-hyderabad-india.jpeg" }
            };
            
            return fallbacks.ContainsKey(city) ? fallbacks[city] : fallbacks["mumbai"];
        }

        // Get attractions from Foursquare
        private async Task<List<object>> GetAttractions(string city, string state)
        {
            var attractions = new List<object>();

            try
            {
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Get,
                    RequestUri = new Uri($"https://api.foursquare.com/v3/places/search?query=tourist%20attractions&near={Uri.EscapeDataString(city)},{Uri.EscapeDataString(state)}&limit=6&sort=RATING")
                };
                
                request.Headers.Add("Authorization", _foursquareKey);

                using var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var body = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(body);

                if (data["results"] != null)
                {
                    foreach (var place in data["results"])
                    {
                        var placeName = place["name"]?.ToString() ?? "Attraction";
                        var imageUrl = await GetPlaceImage(placeName);
                        var price = place["price"]?.ToString() ?? "2";
                        var rating = place["rating"]?.ToString() ?? "4.3";

                        attractions.Add(new
                        {
                            Name = placeName,
                            Category = place["categories"]?[0]?["name"]?.ToString() ?? "Attraction",
                            Description = GetAttractionDescription(placeName, city),
                            Time = "2-3 hours",
                            Price = GetPriceRange(price),
                            Image = imageUrl,
                            Rating = rating,
                            Latitude = place["geocodes"]?["main"]?["latitude"]?.ToString(),
                            Longitude = place["geocodes"]?["main"]?["longitude"]?.ToString()
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Foursquare API error: {ex.Message}");
            }

            // If no attractions found, return predefined ones
            if (attractions.Count == 0)
            {
                attractions = GetPredefinedAttractions(city.ToLower());
            }

            return attractions;
        }

        // Get local food from Foursquare
        private async Task<List<object>> GetLocalFood(string city)
        {
            var foodList = new List<object>();

            try
            {
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Get,
                    RequestUri = new Uri($"https://api.foursquare.com/v3/places/search?near={Uri.EscapeDataString(city)},India&categories=13065&limit=6&sort=RATING")
                };
                
                request.Headers.Add("Authorization", _foursquareKey);

                using var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var body = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(body);

                if (data["results"] != null)
                {
                    foreach (var place in data["results"])
                    {
                        var placeName = place["name"]?.ToString() ?? "Restaurant";
                        var imageUrl = await GetFoodImage(placeName);
                        var price = place["price"]?.ToString() ?? "2";
                        var rating = place["rating"]?.ToString() ?? "4.3";

                        foodList.Add(new
                        {
                            Name = placeName,
                            Description = place["description"]?.ToString() ?? $"Try {placeName} in {city}",
                            Price = GetPriceRange(price),
                            Image = imageUrl,
                            Cuisine = place["categories"]?[0]?["name"]?.ToString() ?? "Local",
                            Rating = rating
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Foursquare food API error: {ex.Message}");
            }

            if (foodList.Count == 0)
            {
                foodList = GetPredefinedFood(city.ToLower());
            }

            return foodList;
        }

        // Get image for a place from Pexels
        private async Task<string> GetPlaceImage(string query)
        {
            try
            {
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Get,
                    RequestUri = new Uri($"https://api.pexels.com/v1/search?query={Uri.EscapeDataString(query)}&per_page=1&orientation=landscape")
                };
                
                request.Headers.Add("Authorization", _pexelsKey);

                using var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var body = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(body);
                
                return data["photos"]?[0]?["src"]?["medium"]?.ToString() 
                       ?? "https://images.pexels.com/photos/917510/pexels-photo-917510.jpeg";
            }
            catch
            {
                return "https://images.pexels.com/photos/917510/pexels-photo-917510.jpeg";
            }
        }

        // Get food image from Pexels
        private async Task<string> GetFoodImage(string query)
        {
            try
            {
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Get,
                    RequestUri = new Uri($"https://api.pexels.com/v1/search?query={Uri.EscapeDataString(query)}%20food&per_page=1")
                };
                
                request.Headers.Add("Authorization", _pexelsKey);

                using var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var body = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(body);
                
                return data["photos"]?[0]?["src"]?["medium"]?.ToString() 
                       ?? "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg";
            }
            catch
            {
                return "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg";
            }
        }

        // Get transport options for each city
        private List<object> GetTransportOptions(string city)
        {
            var transport = new Dictionary<string, List<object>>
            {
                { "mumbai", new List<object> {
                    new { Type = "train", Name = "Mumbai Local", Description = "Lifeline of the city - fast and frequent", Price = "₹10-50" },
                    new { Type = "taxi", Name = "Kaali-Peeli Taxi", Description = "Black & yellow cabs, best for short distances", Price = "₹100-500" },
                    new { Type = "bus", Name = "BEST Bus", Description = "Extensive network covering all areas", Price = "₹5-30" }
                }},
                { "delhi", new List<object> {
                    new { Type = "train", Name = "Delhi Metro", Description = "Modern, clean and efficient", Price = "₹10-60" },
                    new { Type = "taxi", Name = "Auto Rickshaw", Description = "Three-wheelers for short trips", Price = "₹50-200" },
                    new { Type = "bus", Name = "DTC Buses", Description = "City buses with AC options", Price = "₹5-25" }
                }},
                { "bangalore", new List<object> {
                    new { Type = "bus", Name = "BMTC Buses", Description = "Extensive city network", Price = "₹10-40" },
                    new { Type = "taxi", Name = "Ola/Uber", Description = "App-based cabs available 24/7", Price = "₹100-300" },
                    new { Type = "train", Name = "Namma Metro", Description = "Rapid transit system", Price = "₹15-60" }
                }},
                { "chennai", new List<object> {
                    new { Type = "train", Name = "Chennai Metro", Description = "Modern metro system", Price = "₹10-50" },
                    new { Type = "bus", Name = "MTC Buses", Description = "City buses", Price = "₹5-25" },
                    new { Type = "taxi", Name = "Auto Rickshaw", Description = "Shared or private", Price = "₹50-200" }
                }},
                { "kolkata", new List<object> {
                    new { Type = "train", Name = "Kolkata Metro", Description = "India's first metro", Price = "₹10-40" },
                    new { Type = "taxi", Name = "Yellow Taxi", Description = "Iconic Ambassador cabs", Price = "₹100-400" },
                    new { Type = "bus", Name = "WBTC Buses", Description = "City buses", Price = "₹5-20" }
                }},
                { "hyderabad", new List<object> {
                    new { Type = "train", Name = "Hyderabad Metro", Description = "Modern metro", Price = "₹10-60" },
                    new { Type = "bus", Name = "TSRTC Buses", Description = "City buses", Price = "₹5-30" },
                    new { Type = "taxi", Name = "Auto Rickshaw", Description = "Green & black autos", Price = "₹50-200" }
                }}
            };

            return transport.ContainsKey(city) ? transport[city] : transport["mumbai"];
        }

        // Get city stats
        private object GetCityStats(string city)
        {
            var stats = new Dictionary<string, object>
            {
                { "mumbai", new { Attractions = 25, Hotels = 50, Food = 100 } },
                { "delhi", new { Attractions = 30, Hotels = 60, Food = 120 } },
                { "bangalore", new { Attractions = 22, Hotels = 55, Food = 150 } },
                { "chennai", new { Attractions = 20, Hotels = 45, Food = 80 } },
                { "kolkata", new { Attractions = 25, Hotels = 50, Food = 90 } },
                { "hyderabad", new { Attractions = 23, Hotels = 48, Food = 95 } }
            };

            return stats.ContainsKey(city) ? stats[city] : stats["mumbai"];
        }

        // Get suggested itinerary for each city
        private List<object> GetSuggestedItinerary(string city)
        {
            var itineraries = new Dictionary<string, List<object>>
            {
                { "mumbai", new List<object> {
                    new {
                        Title = "South Mumbai Heritage Tour",
                        Activities = new List<object> {
                            new { Time = "09:00 AM", Type = "visit", Description = "Gateway of India - Start your day at this iconic monument" },
                            new { Time = "10:30 AM", Type = "visit", Description = "Taj Mahal Palace Hotel - Admire the stunning architecture" },
                            new { Time = "12:30 PM", Type = "food", Description = "Lunch at Leopold Cafe - Famous Irani cafe" },
                            new { Time = "02:30 PM", Type = "visit", Description = "Chhatrapati Shivaji Terminus - UNESCO World Heritage site" },
                            new { Time = "05:00 PM", Type = "travel", Description = "Taxi to Marine Drive" },
                            new { Time = "06:30 PM", Type = "visit", Description = "Sunset at Marine Drive - Walk along the Queen's Necklace" }
                        }
                    },
                    new {
                        Title = "Bollywood & Street Food",
                        Activities = new List<object> {
                            new { Time = "10:00 AM", Type = "visit", Description = "Bollywood Studio Tour - Visit Film City" },
                            new { Time = "01:00 PM", Type = "food", Description = "Vada Pav at Anand Stall - Mumbai's favorite street food" },
                            new { Time = "03:00 PM", Type = "visit", Description = "Colaba Causeway - Shopping for souvenirs" },
                            new { Time = "07:00 PM", Type = "food", Description = "Pav Bhaji at Juhu Beach - Evening snack" }
                        }
                    }
                }},
                { "delhi", new List<object> {
                    new {
                        Title = "Old Delhi Heritage Walk",
                        Activities = new List<object> {
                            new { Time = "09:00 AM", Type = "visit", Description = "Red Fort - Mughal architecture marvel" },
                            new { Time = "11:30 AM", Type = "visit", Description = "Jama Masjid - India's largest mosque" },
                            new { Time = "01:00 PM", Type = "food", Description = "Lunch at Karim's - Famous Mughlai cuisine" },
                            new { Time = "03:00 PM", Type = "visit", Description = "Chandni Chowk Rickshaw Ride" },
                            new { Time = "05:00 PM", Type = "food", Description = "Street food at Paranthe Wali Gali" }
                        }
                    },
                    new {
                        Title = "New Delhi & Modern India",
                        Activities = new List<object> {
                            new { Time = "10:00 AM", Type = "visit", Description = "India Gate - War memorial" },
                            new { Time = "11:30 AM", Type = "visit", Description = "Rashtrapati Bhavan - Presidential palace" },
                            new { Time = "01:00 PM", Type = "food", Description = "Lunch at Connaught Place" },
                            new { Time = "03:00 PM", Type = "visit", Description = "Qutub Minar - UNESCO World Heritage" },
                            new { Time = "06:00 PM", Type = "visit", Description = "Lotus Temple - Evening visit" }
                        }
                    }
                }},
                { "bangalore", new List<object> {
                    new {
                        Title = "Royal Bangalore",
                        Activities = new List<object> {
                            new { Time = "10:00 AM", Type = "visit", Description = "Bangalore Palace - Tudor-style architecture" },
                            new { Time = "12:30 PM", Type = "visit", Description = "Tipu Sultan's Summer Palace" },
                            new { Time = "02:00 PM", Type = "food", Description = "Traditional South Indian meal at MTR" },
                            new { Time = "04:00 PM", Type = "visit", Description = "Cubbon Park - Lush green garden" },
                            new { Time = "07:00 PM", Type = "food", Description = "Craft beer at Toit - Famous microbrewery" }
                        }
                    },
                    new {
                        Title = "Tech & Trendy Bangalore",
                        Activities = new List<object> {
                            new { Time = "09:00 AM", Type = "visit", Description = "Vidhana Soudha - State legislature" },
                            new { Time = "11:00 AM", Type = "visit", Description = "Lalbagh Botanical Garden" },
                            new { Time = "01:00 PM", Type = "food", Description = "Bisi Bele Bath at Vidyarthi Bhavan" },
                            new { Time = "03:00 PM", Type = "visit", Description = "Commercial Street Shopping" },
                            new { Time = "07:00 PM", Type = "food", Description = "Dinner at Koshy's - Iconic restaurant" }
                        }
                    }
                }}
            };

            return itineraries.ContainsKey(city) ? itineraries[city] : itineraries["mumbai"];
        }

        // Predefined attractions fallback
        private List<object> GetPredefinedAttractions(string city)
        {
            var attractions = new Dictionary<string, List<object>>
            {
                { "mumbai", new List<object> {
                    new { Name = "Gateway of India", Category = "Landmark", Description = "Iconic arch monument built in 1924", Time = "1-2 hours", Price = "Free", Image = "https://images.pexels.com/photos/3704719/pexels-photo-3704719.jpeg", Rating = "4.8" },
                    new { Name = "Marine Drive", Category = "Scenic", Description = "Queen's Necklace - 3.6 km boulevard", Time = "2-3 hours", Price = "Free", Image = "https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg", Rating = "4.7" },
                    new { Name = "Elephanta Caves", Category = "Heritage", Description = "Ancient cave temples (UNESCO Site)", Time = "4-5 hours", Price = "₹600", Image = "https://images.pexels.com/photos/917510/pexels-photo-917510.jpeg", Rating = "4.6" }
                }},
                { "delhi", new List<object> {
                    new { Name = "India Gate", Category = "Landmark", Description = "42m high war memorial", Time = "1-2 hours", Price = "Free", Image = "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg", Rating = "4.8" },
                    new { Name = "Qutub Minar", Category = "Heritage", Description = "73m victory tower (UNESCO)", Time = "2-3 hours", Price = "₹500", Image = "https://images.pexels.com/photos/5560362/pexels-photo-5560362.jpeg", Rating = "4.7" },
                    new { Name = "Red Fort", Category = "Landmark", Description = "Mughal fortress (UNESCO)", Time = "3-4 hours", Price = "₹500", Image = "https://images.pexels.com/photos/917510/pexels-photo-917510.jpeg", Rating = "4.6" }
                }},
                { "bangalore", new List<object> {
                    new { Name = "Bangalore Palace", Category = "Landmark", Description = "Tudor-style palace", Time = "2-3 hours", Price = "₹400", Image = "https://images.pexels.com/photos/9395600/pexels-photo-9395600.jpeg", Rating = "4.6" },
                    new { Name = "Lalbagh Garden", Category = "Nature", Description = "240-acre botanical garden", Time = "2-3 hours", Price = "₹20", Image = "https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg", Rating = "4.7" },
                    new { Name = "Vidhana Soudha", Category = "Landmark", Description = "State legislature building", Time = "1 hour", Price = "Free", Image = "https://images.pexels.com/photos/9395600/pexels-photo-9395600.jpeg", Rating = "4.5" }
                }}
            };

            return attractions.ContainsKey(city) ? attractions[city] : attractions["mumbai"];
        }

        // Predefined food fallback
        private List<object> GetPredefinedFood(string city)
        {
            var food = new Dictionary<string, List<object>>
            {
                { "mumbai", new List<object> {
                    new { Name = "Vada Pav", Description = "Spicy potato fritter in a bun - Mumbai's favorite", Price = "₹20", Image = "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg", Cuisine = "Street Food", Rating = "4.9" },
                    new { Name = "Pav Bhaji", Description = "Buttery bread with mixed vegetable curry", Price = "₹120", Image = "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg", Cuisine = "Street Food", Rating = "4.8" },
                    new { Name = "Bombay Sandwich", Description = "Grilled vegetable sandwich with mint chutney", Price = "₹80", Image = "https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg", Cuisine = "Street Food", Rating = "4.7" }
                }},
                { "delhi", new List<object> {
                    new { Name = "Chole Bhature", Description = "Spicy chickpea curry with fried bread", Price = "₹100", Image = "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg", Cuisine = "North Indian", Rating = "4.9" },
                    new { Name = "Butter Chicken", Description = "Creamy tomato-based chicken curry", Price = "₹350", Image = "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg", Cuisine = "Mughlai", Rating = "4.9" },
                    new { Name = "Paratha", Description = "Stuffed flatbread from Paranthe Wali Gali", Price = "₹50", Image = "https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg", Cuisine = "Breakfast", Rating = "4.7" }
                }},
                { "bangalore", new List<object> {
                    new { Name = "Masala Dosa", Description = "Crispy rice crepe with potato filling", Price = "₹80", Image = "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg", Cuisine = "South Indian", Rating = "4.9" },
                    new { Name = "Bisi Bele Bath", Description = "Spicy rice and lentil dish", Price = "₹100", Image = "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg", Cuisine = "South Indian", Rating = "4.7" },
                    new { Name = "Filter Coffee", Description = "South Indian style coffee", Price = "₹30", Image = "https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg", Cuisine = "Beverage", Rating = "4.8" }
                }}
            };

            return food.ContainsKey(city) ? food[city] : food["mumbai"];
        }

        private string GetPriceRange(string price)
        {
            return price switch
            {
                "1" => "₹100-300",
                "2" => "₹300-600",
                "3" => "₹600-1000",
                "4" => "₹1000+",
                _ => "₹100-500"
            };
        }

        private string GetAttractionDescription(string placeName, string city)
        {
            var descriptions = new Dictionary<string, string>
            {
                { "Gateway of India", "Iconic arch monument overlooking the Arabian Sea" },
                { "India Gate", "42-meter high war memorial in the heart of Delhi" },
                { "Qutub Minar", "73-meter victory tower, UNESCO World Heritage site" },
                { "Red Fort", "Massive Mughal fortress made of red sandstone" },
                { "Bangalore Palace", "Tudor-style palace built in 1887" },
                { "Charminar", "16th-century mosque with four grand arches" }
            };

            return descriptions.ContainsKey(placeName) 
                ? descriptions[placeName] 
                : $"Visit {placeName} in {city}";
        }
    }
}