using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UPath.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Controllers with camelCase JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// OpenAPI – accessible at /openapi/v1.json in Development
builder.Services.AddOpenApi();

// Distributed memory cache (required by session middleware)
builder.Services.AddDistributedMemoryCache();

// Session support – cookie-based auth
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24);
    options.Cookie.Name = "UPath.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.IsEssential = true;
});

// CORS – allow the Vite dev server (and any value set in config)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration["AllowedOrigins"]
            ?? "http://localhost:8080";

        policy.WithOrigins(allowedOrigins.Split(',', StringSplitOptions.TrimEntries))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// EF Core with Npgsql
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors();
app.UseSession();

// Auth middleware – reject unauthenticated requests to protected API routes
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLower() ?? "";

    // Only guard /api/* routes
    if (path.StartsWith("/api/"))
    {
        // Allow public endpoints through without a session
        var isPublic = path.StartsWith("/api/auth/login")
                    || path.StartsWith("/api/auth/me")
                    || path.StartsWith("/api/auth/logout")
                    || path.StartsWith("/api/account/register")
                    || path.StartsWith("/api/health");

        if (!isPublic)
        {
            var userId = context.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\":\"Authentication required\"}");
                return;
            }
        }
    }

    await next();
});

app.MapControllers();

app.Run();
