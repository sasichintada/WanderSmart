using wanderSmart.Backend.DTOs;

namespace wanderSmart.Backend.Services;

public interface IItineraryGenerationService
{
    Task<GeneratedItineraryResponseDTO> GenerateItineraryAsync(GenerateItineraryRequestDTO request, string userId);
}