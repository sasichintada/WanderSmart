using wanderSmart.Backend.DTOs;
using wanderSmart.Backend.Interfaces;
using wanderSmart.Backend.Models;
using wanderSmart.Backend.Models.Enums;

namespace wanderSmart.Backend.Services;

public class ItineraryService : IItineraryService
{
    private readonly IItineraryRepository _itineraryRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<ItineraryService> _logger;

    public ItineraryService(
        IItineraryRepository itineraryRepository,
        IUserRepository userRepository,
        ILogger<ItineraryService> logger)
    {
        _itineraryRepository = itineraryRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<List<ItineraryResponseDTO>> GetUserItinerariesAsync(string userId)
    {
        var itineraries = await _itineraryRepository.GetByUserIdAsync(userId);
        return await MapToDTOList(itineraries);
    }

    public async Task<List<ItineraryResponseDTO>> GetPublicItinerariesAsync(string? destination, int page = 1, int pageSize = 10)
    {
        var itineraries = await _itineraryRepository.GetPublicItinerariesAsync(destination, page, pageSize);
        return await MapToDTOList(itineraries);
    }

    public async Task<ItineraryResponseDTO> GetItineraryByIdAsync(string id, string userId)
    {
        var itinerary = await _itineraryRepository.GetByIdAsync(id);
        
        if (itinerary == null)
            throw new KeyNotFoundException($"Itinerary with id {id} not found");
        
        if (!itinerary.IsPublic && itinerary.UserId != userId)
            throw new UnauthorizedAccessException("You don't have permission to view this itinerary");

        return await MapToDTO(itinerary);
    }

    public async Task<ItineraryResponseDTO> CreateItineraryAsync(string userId, CreateItineraryDTO createDto)
{
    _logger.LogInformation("Creating itinerary for user {UserId} with {DayCount} days", userId, createDto.Days?.Count ?? 0);

    try
    {
        // Parse enums
        if (!Enum.TryParse<BudgetLevel>(createDto.BudgetLevel, true, out var budgetLevel))
        {
            budgetLevel = BudgetLevel.Medium;
        }

        if (!Enum.TryParse<TravelStyle>(createDto.TravelStyle, true, out var travelStyle))
        {
            travelStyle = TravelStyle.Adventure;
        }

        var itinerary = new Itinerary
        {
            UserId = userId,
            Title = createDto.Title,
            Destination = createDto.Destination,
            Description = createDto.Description,
            StartDate = createDto.StartDate,
            EndDate = createDto.EndDate,
            TotalBudget = createDto.TotalBudget,
            BudgetLevel = budgetLevel,
            TravelStyle = travelStyle,
            Tags = createDto.Tags ?? new List<string>(),
            IsPublic = createDto.IsPublic,
            Days = new List<DayPlan>()
        };

        // Map days if present
        if (createDto.Days != null && createDto.Days.Any())
        {
            itinerary.Days = createDto.Days.Select(d => new DayPlan
            {
                DayNumber = d.DayNumber,
                Date = d.Date,
                Theme = d.Theme,
                Notes = d.Notes,
                Activities = d.Activities.Select(a => 
                {
                    // Parse activity category
                    if (!Enum.TryParse<ActivityCategory>(a.Category, true, out var activityCategory))
                    {
                        activityCategory = ActivityCategory.Sightseeing;
                    }

                    // Parse times
                    if (!TimeSpan.TryParse(a.StartTime, out var startTime))
                    {
                        startTime = TimeSpan.FromHours(9);
                    }

                    if (!TimeSpan.TryParse(a.EndTime, out var endTime))
                    {
                        endTime = TimeSpan.FromHours(11);
                    }

                    return new Activity
                    {
                        // DO NOT SET ID HERE - let MongoDB generate it automatically
                        Name = a.Name,
                        Description = a.Description,
                        StartTime = startTime,
                        EndTime = endTime,
                        Location = a.Location,
                        Latitude = a.Latitude,
                        Longitude = a.Longitude,
                        Cost = a.Cost,
                        Category = activityCategory,
                        ImageUrl = a.ImageUrl,
                        IsBooked = a.IsBooked,
                        BookingReference = a.BookingReference
                    };
                }).ToList()
            }).ToList();
        }

        var created = await _itineraryRepository.CreateAsync(itinerary);
        
        _logger.LogInformation("Itinerary created with ID: {ItineraryId}, Days saved: {DayCount}", 
            created.Id, created.Days?.Count ?? 0);
        
        return await MapToDTO(created);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating itinerary for user {UserId}", userId);
        throw new Exception($"Failed to create itinerary: {ex.Message}", ex);
    }
}

    public async Task<ItineraryResponseDTO> UpdateItineraryAsync(string id, string userId, UpdateItineraryDTO updateDto)
    {
        var itinerary = await _itineraryRepository.GetByIdAsync(id);
        
        if (itinerary == null)
            throw new KeyNotFoundException($"Itinerary with id {id} not found");
        
        if (itinerary.UserId != userId)
            throw new UnauthorizedAccessException("You don't have permission to update this itinerary");

        try
        {
            // Update fields if provided
            if (!string.IsNullOrEmpty(updateDto.Title)) itinerary.Title = updateDto.Title;
            if (!string.IsNullOrEmpty(updateDto.Description)) itinerary.Description = updateDto.Description;
            if (updateDto.StartDate.HasValue) itinerary.StartDate = updateDto.StartDate.Value;
            if (updateDto.EndDate.HasValue) itinerary.EndDate = updateDto.EndDate.Value;
            if (updateDto.TotalBudget.HasValue) itinerary.TotalBudget = updateDto.TotalBudget.Value;
            
            if (!string.IsNullOrEmpty(updateDto.BudgetLevel) && Enum.TryParse<BudgetLevel>(updateDto.BudgetLevel, true, out var budgetLevel))
                itinerary.BudgetLevel = budgetLevel;
            
            if (!string.IsNullOrEmpty(updateDto.TravelStyle) && Enum.TryParse<TravelStyle>(updateDto.TravelStyle, true, out var travelStyle))
                itinerary.TravelStyle = travelStyle;
            
            if (updateDto.Tags != null) itinerary.Tags = updateDto.Tags;
            if (updateDto.IsPublic.HasValue) itinerary.IsPublic = updateDto.IsPublic.Value;

            var updated = await _itineraryRepository.UpdateAsync(itinerary);
            
            if (!updated)
                throw new Exception("Failed to update itinerary");

            return await MapToDTO(itinerary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating itinerary {Id}", id);
            throw;
        }
    }

    public async Task<bool> DeleteItineraryAsync(string id, string userId)
    {
        var itinerary = await _itineraryRepository.GetByIdAsync(id);
        
        if (itinerary == null)
            return false;
        
        if (itinerary.UserId != userId)
            throw new UnauthorizedAccessException("You don't have permission to delete this itinerary");

        return await _itineraryRepository.DeleteAsync(id);
    }

    public async Task<bool> LikeItineraryAsync(string itineraryId, string userId)
    {
        var result = await _itineraryRepository.LikeItineraryAsync(itineraryId, userId);
        
        if (result)
        {
            var itinerary = await _itineraryRepository.GetByIdAsync(itineraryId);
            var user = await _userRepository.GetByIdAsync(userId);
            
            if (itinerary != null && user != null)
            {
                var liked = itinerary.LikedBy.Contains(userId);
                await _userRepository.AddActivityAsync(userId, new UserActivity
                {
                    ActivityType = ActivityType.UpdateItinerary,
                    Description = $"{(liked ? "Liked" : "Unliked")} itinerary: {itinerary.Title}",
                    Metadata = new Dictionary<string, string> 
                    { 
                        ["itineraryId"] = itineraryId,
                        ["action"] = liked ? "like" : "unlike"
                    }
                });
            }
        }

        return result;
    }

    private async Task<List<ItineraryResponseDTO>> MapToDTOList(List<Itinerary> itineraries)
    {
        var dtos = new List<ItineraryResponseDTO>();
        foreach (var itinerary in itineraries)
        {
            dtos.Add(await MapToDTO(itinerary));
        }
        return dtos;
    }

    private async Task<ItineraryResponseDTO> MapToDTO(Itinerary itinerary)
    {
        var user = await _userRepository.GetByIdAsync(itinerary.UserId);
        
        return new ItineraryResponseDTO
        {
            Id = itinerary.Id,
            UserId = itinerary.UserId,
            UserName = user?.Username ?? "Unknown User",
            Title = itinerary.Title,
            Destination = itinerary.Destination,
            Description = itinerary.Description,
            StartDate = itinerary.StartDate,
            EndDate = itinerary.EndDate,
            TotalBudget = itinerary.TotalBudget,
            BudgetLevel = itinerary.BudgetLevel.ToString(),
            TravelStyle = itinerary.TravelStyle.ToString(),
            Days = itinerary.Days?.Select(d => new DayPlanDTO
            {
                DayNumber = d.DayNumber,
                Date = d.Date,
                Theme = d.Theme,
                Notes = d.Notes,
                Activities = d.Activities?.Select(a => new ActivityDTO
                {
                    Id = a.Id,
                    Name = a.Name,
                    Description = a.Description,
                    StartTime = a.StartTime.ToString(@"hh\:mm"),
                    EndTime = a.EndTime.ToString(@"hh\:mm"),
                    Location = a.Location,
                    Latitude = a.Latitude,
                    Longitude = a.Longitude,
                    Cost = a.Cost,
                    Category = a.Category.ToString(),
                    ImageUrl = a.ImageUrl,
                    IsBooked = a.IsBooked,
                    BookingReference = a.BookingReference
                }).ToList() ?? new List<ActivityDTO>()
            }).ToList() ?? new List<DayPlanDTO>(),
            Tags = itinerary.Tags ?? new List<string>(),
            IsPublic = itinerary.IsPublic,
            Views = itinerary.Views,
            Likes = itinerary.Likes,
            CreatedAt = itinerary.CreatedAt
        };
    }
}