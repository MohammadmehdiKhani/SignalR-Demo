using signalrBackend.Hubs;
using signalrBackend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddSignalR();
builder.Services.AddSingleton<VotingService>();
builder.Services.AddSingleton<RaceService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .WithOrigins("http://localhost:3000") // React app URL
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must be before other middleware
app.UseCors("AllowAll");

app.UseRouting();
app.UseAuthorization();

// Map SignalR hubs
app.MapHub<CounterHub>("/clientCounterHub");
app.MapHub<VotingHub>("/votingHub");
app.MapHub<RaceHub>("/raceHub");

app.MapControllers();

app.Run();