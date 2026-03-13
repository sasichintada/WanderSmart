using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace wanderSmart.Backend.SignalR;

[Authorize]
public class NotificationHub : Hub
{
    private static readonly Dictionary<string, string> UserConnections = new();
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            UserConnections[userId] = Context.ConnectionId;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            
            _logger.LogInformation("User {UserId} connected to SignalR", userId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            UserConnections.Remove(userId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
            
            _logger.LogInformation("User {UserId} disconnected from SignalR", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendNotification(string userId, string message, string type = "info")
    {
        await Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", new
        {
            Message = message,
            Type = type,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task SendActivityUpdate(string userId, object activity)
    {
        await Clients.Group($"user-{userId}").SendAsync("ActivityUpdate", activity);
    }
}