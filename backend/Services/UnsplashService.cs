using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Configuration;
using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Services
{
    public class UnsplashService
    {
        private readonly HttpClient _httpClient;
        private readonly string _accessKey;

        public UnsplashService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _accessKey = configuration["Unsplash:AccessKey"] ?? throw new InvalidOperationException("Unsplash AccessKey is missing from configuration");
        }

        /// <summary>
        /// Search for images of a specific city
        /// </summary>
        /// <param name="city">City name to search for</param>
        /// <param name="count">Number of images to return</param>
        /// <returns>List of city images with photographer details</returns>
        public async Task<List<CityImageResponseDTO>> SearchCityImages(string city, int count = 4)
        {
            try
            {
                var request = new HttpRequestMessage
                {
                    Method = HttpMethod.Get,
                    RequestUri = new Uri($"https://api.unsplash.com/search/photos?query={city}%20India%20landmark&per_page={count}&orientation=landscape&content_filter=high")
                };
                
                request.Headers.Add("Authorization", $"Client-ID {_accessKey}");

                using var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                
                var body = await response.Content.ReadAsStringAsync();
                var data = JObject.Parse(body);
                
                var results = new List<CityImageResponseDTO>();
                
                // Check if results exist
                if (data["results"] is JArray resultsArray)
                {
                    foreach (var result in resultsArray)
                    {
                        // Safely extract values with null checks
                        string id = result["id"]?.ToString() ?? string.Empty;
                        string description = result["description"]?.ToString() ?? 
                                            result["alt_description"]?.ToString() ?? 
                                            city;
                        
                        string url = result["urls"]?["regular"]?.ToString() ?? string.Empty;
                        string thumbnail = result["urls"]?["thumb"]?.ToString() ?? string.Empty;
                        string photographer = result["user"]?["name"]?.ToString() ?? "Unsplash";
                        string photographerLink = result["user"]?["links"]?["html"]?.ToString() ?? "https://unsplash.com";
                        string link = result["links"]?["html"]?.ToString() ?? "https://unsplash.com";
                        
                        results.Add(new CityImageResponseDTO
                        {
                            Id = id,
                            Description = description,
                            Url = string.IsNullOrEmpty(url) ? string.Empty : url + "&auto=format",
                            Thumbnail = thumbnail,
                            Photographer = photographer,
                            PhotographerLink = photographerLink,
                            Link = link
                        });
                    }
                }
                
                return results;
            }
            catch (Exception ex)
            {
                // Log the error and return empty list
                Console.WriteLine($"Error fetching images for {city}: {ex.Message}");
                return new List<CityImageResponseDTO>();
            }
        }
    }
}