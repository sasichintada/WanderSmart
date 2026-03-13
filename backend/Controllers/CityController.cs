using Microsoft.AspNetCore.Mvc;
using wanderSmart.Backend.Services;
using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Controllers
{
    /// <summary>
    /// Manages city information, attractions, and local data
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class CityController : ControllerBase
    {
        private readonly CityDataService _cityDataService;

        public CityController(CityDataService cityDataService)
        {
            _cityDataService = cityDataService;
        }

        /// <summary>
        /// Get detailed information about a specific city including attractions, food, transport, and suggested itineraries
        /// </summary>
        /// <param name="city">Name of the city (e.g., Mumbai, Delhi, Bangalore)</param>
        /// <param name="state">State name (optional, for disambiguation)</param>
        /// <returns>Complete city information with attractions, food, transport options, and suggested itineraries</returns>
        /// <response code="200">Returns city details successfully</response>
        /// <response code="500">If there's an error fetching city data</response>
        [HttpGet("{city}")]
        [ProducesResponseType(typeof(CityDetailsResponseDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetCityDetails(string city, [FromQuery] string state = "")
        {
            try
            {
                var data = await _cityDataService.GetCityDetails(city, state);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get a list of major metro cities in India
        /// </summary>
        /// <returns>List of metro cities with their names, states, and codes</returns>
        /// <response code="200">Returns list of metro cities</response>
        [HttpGet("metro-cities")]
        [ProducesResponseType(typeof(List<MetroCityDTO>), StatusCodes.Status200OK)]
        public IActionResult GetMetroCities()
        {
            var cities = new[]
            {
                new MetroCityDTO { Name = "Mumbai", State = "Maharashtra", Code = "mumbai" },
                new MetroCityDTO { Name = "Delhi", State = "Delhi", Code = "delhi" },
                new MetroCityDTO { Name = "Bangalore", State = "Karnataka", Code = "bangalore" },
                new MetroCityDTO { Name = "Chennai", State = "Tamil Nadu", Code = "chennai" },
                new MetroCityDTO { Name = "Kolkata", State = "West Bengal", Code = "kolkata" },
                new MetroCityDTO { Name = "Hyderabad", State = "Telangana", Code = "hyderabad" },
                new MetroCityDTO { Name = "Jaipur", State = "Rajasthan", Code = "jaipur" },
                new MetroCityDTO { Name = "Ahmedabad", State = "Gujarat", Code = "ahmedabad" },
                new MetroCityDTO { Name = "Pune", State = "Maharashtra", Code = "pune" },
                new MetroCityDTO { Name = "Lucknow", State = "Uttar Pradesh", Code = "lucknow" }
            };

            return Ok(cities);
        }
    }
}