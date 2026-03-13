using Microsoft.AspNetCore.Mvc;
using wanderSmart.Backend.Services;
using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Controllers
{
    /// <summary>
    /// Handles image searches and retrieval for cities and destinations
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ImageController : ControllerBase
    {
        private readonly UnsplashService _unsplashService;

        public ImageController(UnsplashService unsplashService)
        {
            _unsplashService = unsplashService;
        }

        /// <summary>
        /// Search for images of a specific city
        /// </summary>
        /// <param name="city">City name to search for (e.g., Mumbai, Delhi, Bangalore)</param>
        /// <param name="count">Number of images to return (default: 4, max: 10)</param>
        /// <returns>List of city images with photographer details</returns>
        /// <response code="200">Returns list of city images</response>
        /// <response code="500">If there's an error fetching images</response>
        [HttpGet("search/{city}")]
        [ProducesResponseType(typeof(List<CityImageResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SearchCityImages(string city, [FromQuery] int count = 4)
        {
            try
            {
                var images = await _unsplashService.SearchCityImages(city, count);
                return Ok(images);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get representative images for popular destinations
        /// </summary>
        /// <returns>List of destinations with one image each</returns>
        /// <response code="200">Returns destination images</response>
        [HttpGet("destinations")]
        [ProducesResponseType(typeof(List<DestinationImageResponseDTO>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDestinationImages()
        {
            var cities = new[] { "Mumbai", "Delhi", "Bangalore", "Kerala", "Jaipur", "Goa", "Varanasi", "Hyderabad", "Chennai", "Kolkata", "Agra", "Udaipur" };
            var results = new List<DestinationImageResponseDTO>();
            
            foreach (var city in cities)
            {
                try
                {
                    var images = await _unsplashService.SearchCityImages(city, 1);
                    
                    // Check if images is a list and has items
                    if (images is List<CityImageResponseDTO> imageList && imageList.Any())
                    {
                        results.Add(new DestinationImageResponseDTO
                        {
                            City = city,
                            Images = imageList.Cast<object>().ToList()
                        });
                    }
                    else
                    {
                        // Fallback if no images
                        results.Add(new DestinationImageResponseDTO
                        {
                            City = city,
                            Images = new List<object> { GetFallbackImage(city) }
                        });
                    }
                    
                    await Task.Delay(100); // Rate limiting
                }
                catch
                {
                    // Fallback
                    results.Add(new DestinationImageResponseDTO
                    {
                        City = city,
                        Images = new List<object> { GetFallbackImage(city) }
                    });
                }
            }
            
            return Ok(results);
        }

        /// <summary>
        /// Get fallback image for a city when API fails
        /// </summary>
        /// <param name="city">City name</param>
        /// <returns>Fallback image object</returns>
        private CityImageResponseDTO GetFallbackImage(string city)
        {
            var fallbacks = new Dictionary<string, string>
            {
                { "Mumbai", "1529257414772-1960b7bea4eb" },
                { "Delhi", "1587474260584-136574528ed5" },
                { "Bangalore", "1596176530529-78163a4f7af2" },
                { "Kerala", "1602216054346-ee39ec6c7b0e" },
                { "Jaipur", "1599661046827-dacff0c0f09a" },
                { "Goa", "1512343879784-960ee40c9b5a" },
                { "Varanasi", "1566837945700-30057527ade0" },
                { "Hyderabad", "1599416430307-52c6c5f4b4b0" },
                { "Chennai", "1587474260584-136574528ed5" },
                { "Kolkata", "1566837945700-30057527ade0" },
                { "Agra", "1564507002483-9e9c4a2c7d5b" },
                { "Udaipur", "1599661046827-dacff0c0f09a" }
            };
            
            var photoId = fallbacks.ContainsKey(city) ? fallbacks[city] : "1529257414772-1960b7bea4eb";
            
            return new CityImageResponseDTO
            {
                Id = $"fallback-{city.ToLower()}",
                Description = $"Beautiful view of {city}",
                Url = $"https://images.unsplash.com/photo-{photoId}?w=800&auto=format&fit=crop",
                Thumbnail = $"https://images.unsplash.com/photo-{photoId}?w=400&auto=format&fit=crop",
                Photographer = "Unsplash",
                PhotographerLink = "https://unsplash.com",
                Link = $"https://unsplash.com/photos/{photoId}"
            };
        }
    }
}