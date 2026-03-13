using wanderSmart.Backend.Models;
using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Interfaces;

public interface IItineraryRepository
{
    Task<Itinerary?> GetByIdAsync(string id);
    Task<List<Itinerary>> GetByUserIdAsync(string userId);
    Task<List<Itinerary>> GetPublicItinerariesAsync(string? destination = null, int page = 1, int pageSize = 10);
    Task<Itinerary> CreateAsync(Itinerary itinerary);
    Task<bool> UpdateAsync(Itinerary itinerary);
    Task<bool> DeleteAsync(string id);
    Task<bool> LikeItineraryAsync(string itineraryId, string userId);
    Task<int> GetUserItineraryCountAsync(string userId);
}