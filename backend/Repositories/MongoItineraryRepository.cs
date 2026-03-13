using MongoDB.Driver;
using wanderSmart.Backend.Data;
using wanderSmart.Backend.Interfaces;
using wanderSmart.Backend.Models;

namespace wanderSmart.Backend.Repositories;

public class MongoItineraryRepository : IItineraryRepository
{
    private readonly MongoDbContext _context;
    private readonly ILogger<MongoItineraryRepository> _logger;

    public MongoItineraryRepository(MongoDbContext context, ILogger<MongoItineraryRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Itinerary?> GetByIdAsync(string id)
    {
        return await _context.Itineraries.Find(i => i.Id == id).FirstOrDefaultAsync();
    }

    public async Task<List<Itinerary>> GetByUserIdAsync(string userId)
    {
        return await _context.Itineraries
            .Find(i => i.UserId == userId)
            .SortByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Itinerary>> GetPublicItinerariesAsync(string? destination = null, int page = 1, int pageSize = 10)
    {
        var filter = Builders<Itinerary>.Filter.Eq(i => i.IsPublic, true);
        
        if (!string.IsNullOrEmpty(destination))
        {
            filter = filter & Builders<Itinerary>.Filter.Regex(i => i.Destination, 
                new MongoDB.Bson.BsonRegularExpression(destination, "i"));
        }

        return await _context.Itineraries
            .Find(filter)
            .SortByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();
    }

    public async Task<Itinerary> CreateAsync(Itinerary itinerary)
    {
        itinerary.CreatedAt = DateTime.UtcNow;
        await _context.Itineraries.InsertOneAsync(itinerary);
        return itinerary;
    }

    public async Task<bool> UpdateAsync(Itinerary itinerary)
    {
        itinerary.UpdatedAt = DateTime.UtcNow;
        var result = await _context.Itineraries.ReplaceOneAsync(i => i.Id == itinerary.Id, itinerary);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var result = await _context.Itineraries.DeleteOneAsync(i => i.Id == id);
        return result.IsAcknowledged && result.DeletedCount > 0;
    }

    public async Task<bool> LikeItineraryAsync(string itineraryId, string userId)
    {
        var itinerary = await GetByIdAsync(itineraryId);
        if (itinerary == null) return false;

        var update = itinerary.LikedBy.Contains(userId)
            ? Builders<Itinerary>.Update
                .Pull(i => i.LikedBy, userId)
                .Inc(i => i.Likes, -1)
            : Builders<Itinerary>.Update
                .AddToSet(i => i.LikedBy, userId)
                .Inc(i => i.Likes, 1);

        var result = await _context.Itineraries.UpdateOneAsync(i => i.Id == itineraryId, update);
        return result.IsAcknowledged && result.ModifiedCount > 0;
    }

    public async Task<int> GetUserItineraryCountAsync(string userId)
    {
        return (int)await _context.Itineraries.CountDocumentsAsync(i => i.UserId == userId);
    }
}