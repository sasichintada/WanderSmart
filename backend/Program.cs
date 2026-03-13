using Serilog;
using wanderSmart.Backend.Data;
using wanderSmart.Backend.Extensions;
using wanderSmart.Backend.SignalR;
using wanderSmart.Backend.Services;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.OpenApi.Any;

var builder = WebApplication.CreateBuilder(args);

// Add Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with comprehensive documentation
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "wanderSmart.Backend", 
        Version = "v1",
        Description = "Smart Travel Itinerary Generator API - Plan your perfect trip with AI-powered recommendations",
        Contact = new OpenApiContact
        {
            Name = "WanderSmart Support",
            Email = "info@wandersmart.com",
            Url = new Uri("https://wandersmart.com")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    // Set the comments path for the Swagger JSON and UI
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // Configure Swagger to use the JWT bearer authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter JWT with Bearer into field. Example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Add custom schema filter for enums
    c.SchemaFilter<EnumSchemaFilter>();
    
    // Custom schema IDs to make schema names cleaner
    c.CustomSchemaIds(type => type.FullName?.Replace("wanderSmart.Backend.DTOs.", ""));
});

// Add custom services using ServiceExtensions
builder.Services.AddMongoDb(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddCorsPolicy();

// Add HttpClient services
builder.Services.AddHttpClient<UnsplashService>();
builder.Services.AddHttpClient<CityDataService>();
builder.Services.AddHttpClient<GeoapifyService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Add Itinerary Generation Service
builder.Services.AddScoped<IItineraryGenerationService, ItineraryGenerationService>();

// Add SignalR
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => 
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "wanderSmart.Backend v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "WanderSmart API Documentation";
        
        // THIS IS THE KEY LINE - makes schemas appear at the bottom
        c.DefaultModelsExpandDepth(1);
        
        // Other safe settings (removed ModelRendering which caused the error)
        c.DisplayRequestDuration();
        c.EnableDeepLinking();
        c.ShowExtensions();
        c.EnableFilter();
        c.DefaultModelExpandDepth(2);
        
        // Add custom CSS to force schemas to be visible
        c.HeadContent = @"
            <style>
                .swagger-ui .models {
                    display: block !important;
                    margin-top: 40px !important;
                    border-top: 2px solid #e7e7e7 !important;
                    padding-top: 20px !important;
                    background: #f2f2f2 !important;
                }
                .swagger-ui .model-container {
                    background: #f8f8f8 !important;
                    border-radius: 8px !important;
                    padding: 15px !important;
                    margin-bottom: 15px !important;
                }
                .swagger-ui .models-control {
                    display: flex !important;
                    align-items: center !important;
                    cursor: pointer !important;
                }
                .swagger-ui .model-box {
                    display: block !important;
                }
            </style>
        ";
    });
    
    // Add custom CSS file for Swagger UI
    app.MapGet("/swagger-custom.css", async context =>
    {
        context.Response.ContentType = "text/css";
        await context.Response.WriteAsync(@"
            .swagger-ui .models {
                display: block !important;
                margin-top: 30px;
                border-top: 2px solid #e7e7e7;
                padding-top: 20px;
            }
            .swagger-ui .model-container {
                background: #f8f8f8;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            }
            .swagger-ui .model-box {
                background: white;
            }
        ");
    });
    
    // Create indexes in development
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    await dbContext.CreateIndexesAsync();
}

// Redirect root to swagger
app.MapGet("/", () => Results.Redirect("/swagger"));

// Use HTTP only - comment out HTTPS if you don't have certificate
// app.UseHttpsRedirection();

app.UseCors("AllowAngularApp");

// Custom middleware
app.UseErrorHandling();
app.UseJwtMiddleware();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers and hubs
app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

try
{
    Log.Information("Starting application");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start");
}
finally
{
    Log.CloseAndFlush();
}

// ============= FILTER CLASSES =============

// Enum schema filter
public class EnumSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (context.Type.IsEnum)
        {
            schema.Enum = Enum.GetNames(context.Type)
                .Select(name => new OpenApiString(name))
                .Cast<IOpenApiAny>()
                .ToList();
            schema.Type = "string";
        }
    }
}