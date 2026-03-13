using wanderSmart.Backend.Middleware;

namespace wanderSmart.Backend.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseErrorHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ErrorHandlingMiddleware>();
    }

    public static IApplicationBuilder UseJwtMiddleware(this IApplicationBuilder app)
    {
        return app.UseMiddleware<JwtMiddleware>();
    }
}