using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using wanderSmart.Backend.DTOs;
using wanderSmart.Backend.Interfaces;
using wanderSmart.Backend.Services;

namespace wanderSmart.Backend.Controllers;

/// <summary>
/// Manages travel itineraries including creation, retrieval, updates, and AI-powered generation
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItineraryController : ControllerBase
{
    private readonly IItineraryService _itineraryService;
    private readonly IItineraryGenerationService _itineraryGenerationService;
    private readonly ILogger<ItineraryController> _logger;

    public ItineraryController(
        IItineraryService itineraryService,
        IItineraryGenerationService itineraryGenerationService,
        ILogger<ItineraryController> logger)
    {
        _itineraryService = itineraryService;
        _itineraryGenerationService = itineraryGenerationService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a new AI-powered itinerary based on destination and preferences
    /// </summary>
    /// <param name="request">Travel details including destination, dates, budget, and preferences</param>
    /// <returns>AI-generated itinerary with day-by-day plan</returns>
    /// <response code="200">Returns the generated itinerary</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="500">If there was an error generating the itinerary</response>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(GeneratedItineraryResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GeneratedItineraryResponseDTO>> GenerateItinerary(GenerateItineraryRequestDTO request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            _logger.LogInformation("Generating itinerary for user {UserId} to {Destination}", userId, request.Destination);
            
            var itinerary = await _itineraryGenerationService.GenerateItineraryAsync(request, userId);
            return Ok(itinerary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating itinerary for {Destination}", request.Destination);
            return StatusCode(500, new { message = "Failed to generate itinerary", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all itineraries for the current user
    /// </summary>
    /// <returns>List of user's itineraries</returns>
    /// <response code="200">Returns list of itineraries</response>
    /// <response code="401">If user is not authenticated</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ItineraryResponseDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<ItineraryResponseDTO>>> GetMyItineraries()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var itineraries = await _itineraryService.GetUserItinerariesAsync(userId);
            return Ok(itineraries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user itineraries");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new custom itinerary manually
    /// </summary>
    /// <param name="createDto">Itinerary details including days and activities</param>
    /// <returns>Created itinerary</returns>
    /// <response code="201">Returns the newly created itinerary</response>
    /// <response code="400">If the itinerary data is invalid</response>
    /// <response code="401">If user is not authenticated</response>
    [HttpPost]
    [ProducesResponseType(typeof(ItineraryResponseDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ItineraryResponseDTO>> CreateItinerary(CreateItineraryDTO createDto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var itinerary = await _itineraryService.CreateItineraryAsync(userId, createDto);
            return CreatedAtAction(nameof(GetItinerary), new { id = itinerary.Id }, itinerary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating itinerary");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get public itineraries that are shared by other users
    /// </summary>
    /// <param name="destination">Filter by destination (optional)</param>
    /// <param name="page">Page number for pagination (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 10)</param>
    /// <returns>List of public itineraries</returns>
    /// <response code="200">Returns list of public itineraries</response>
    [HttpGet("public")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<ItineraryResponseDTO>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ItineraryResponseDTO>>> GetPublicItineraries(
        [FromQuery] string? destination,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var itineraries = await _itineraryService.GetPublicItinerariesAsync(destination, page, pageSize);
            return Ok(itineraries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public itineraries");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get a specific itinerary by ID
    /// </summary>
    /// <param name="id">Itinerary ID</param>
    /// <returns>Itinerary details</returns>
    /// <response code="200">Returns the itinerary</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user doesn't have permission to view this itinerary</response>
    /// <response code="404">If itinerary not found</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ItineraryResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItineraryResponseDTO>> GetItinerary(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var itinerary = await _itineraryService.GetItineraryByIdAsync(id, userId);
            return Ok(itinerary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting itinerary {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update an existing itinerary
    /// </summary>
    /// <param name="id">Itinerary ID</param>
    /// <param name="updateDto">Updated itinerary data</param>
    /// <returns>Updated itinerary</returns>
    /// <response code="200">Returns the updated itinerary</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user doesn't have permission to update this itinerary</response>
    /// <response code="404">If itinerary not found</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ItineraryResponseDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ItineraryResponseDTO>> UpdateItinerary(string id, UpdateItineraryDTO updateDto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var itinerary = await _itineraryService.UpdateItineraryAsync(id, userId, updateDto);
            return Ok(itinerary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating itinerary {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete an itinerary
    /// </summary>
    /// <param name="id">Itinerary ID</param>
    /// <returns>No content if successful</returns>
    /// <response code="204">If itinerary was successfully deleted</response>
    /// <response code="401">If user is not authenticated</response>
    /// <response code="403">If user doesn't have permission to delete this itinerary</response>
    /// <response code="404">If itinerary not found</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteItinerary(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var result = await _itineraryService.DeleteItineraryAsync(id, userId);
            
            if (result)
            {
                return NoContent();
            }
            
            return NotFound(new { message = "Itinerary not found" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting itinerary {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Like or unlike an itinerary
    /// </summary>
    /// <param name="id">Itinerary ID</param>
    /// <returns>Success message</returns>
    /// <response code="200">If like/unlike was successful</response>
    /// <response code="400">If unable to like the itinerary</response>
    /// <response code="401">If user is not authenticated</response>
    [HttpPost("{id}/like")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LikeItinerary(string id)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (userId == null)
            {
                return Unauthorized();
            }

            var result = await _itineraryService.LikeItineraryAsync(id, userId);
            
            if (result)
            {
                return Ok(new { message = "Itinerary liked successfully" });
            }
            
            return BadRequest(new { message = "Unable to like itinerary" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking itinerary {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}