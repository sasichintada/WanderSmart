using Microsoft.Extensions.Options;
using MongoDB.Driver;
using wanderSmart.Backend.Configurations;
using wanderSmart.Backend.Models;

namespace wanderSmart.Backend.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly MongoClient _client;

    public MongoDbContext(IOptions<MongoDbSettings> settings)
    {
        _client = new MongoClient(settings.Value.ConnectionString);
        _database = _client.GetDatabase(settings.Value.DatabaseName);
    }

    public IMongoCollection<User> Users => _database.GetCollection<User>("Users");
    public IMongoCollection<Itinerary> Itineraries => _database.GetCollection<Itinerary>("Itineraries");
    
    // Create indexes for better performance
    public async Task CreateIndexesAsync()
    {
        // User indexes
        var userIndexes = Users.Indexes;
        
        // Email unique index
        var emailKey = Builders<User>.IndexKeys.Ascending(u => u.Email);
        var emailIndexModel = new CreateIndexModel<User>(emailKey, new CreateIndexOptions { Unique = true });
        await userIndexes.CreateOneAsync(emailIndexModel);
        
        // Username unique index
        var usernameKey = Builders<User>.IndexKeys.Ascending(u => u.Username);
        var usernameIndexModel = new CreateIndexModel<User>(usernameKey, new CreateIndexOptions { Unique = true });
        await userIndexes.CreateOneAsync(usernameIndexModel);
        
        // Itinerary indexes
        var itineraryIndexes = Itineraries.Indexes;
        
        // UserId index
        var userIdKey = Builders<Itinerary>.IndexKeys.Ascending(i => i.UserId);
        await itineraryIndexes.CreateOneAsync(new CreateIndexModel<Itinerary>(userIdKey));
        
        // Destination index
        var destinationKey = Builders<Itinerary>.IndexKeys.Ascending(i => i.Destination);
        await itineraryIndexes.CreateOneAsync(new CreateIndexModel<Itinerary>(destinationKey));
        
        // Date range index for queries
        var dateKey = Builders<Itinerary>.IndexKeys.Ascending(i => i.StartDate).Ascending(i => i.EndDate);
        await itineraryIndexes.CreateOneAsync(new CreateIndexModel<Itinerary>(dateKey));
        
        // Text search index
        var textKey = Builders<Itinerary>.IndexKeys.Text(i => i.Title).Text(i => i.Description).Text(i => i.Destination);
        await itineraryIndexes.CreateOneAsync(new CreateIndexModel<Itinerary>(textKey));
    }
}