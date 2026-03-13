using wanderSmart.Backend.DTOs;  // ADD THIS

namespace wanderSmart.Backend.Interfaces;

public interface IItineraryService
{
    Task<List<ItineraryResponseDTO>> GetUserItinerariesAsync(string userId);
    Task<List<ItineraryResponseDTO>> GetPublicItinerariesAsync(string? destination, int page = 1, int pageSize = 10);
    Task<ItineraryResponseDTO> GetItineraryByIdAsync(string id, string userId);
    Task<ItineraryResponseDTO> CreateItineraryAsync(string userId, CreateItineraryDTO createDto);
    Task<ItineraryResponseDTO> UpdateItineraryAsync(string id, string userId, UpdateItineraryDTO updateDto);
    Task<bool> DeleteItineraryAsync(string id, string userId);
    Task<bool> LikeItineraryAsync(string itineraryId, string userId);
}