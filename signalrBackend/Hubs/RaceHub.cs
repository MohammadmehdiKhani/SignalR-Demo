using Microsoft.AspNetCore.SignalR;
using signalrBackend.Models;
using signalrBackend.Services;
using Microsoft.Extensions.Logging;

namespace signalrBackend.Hubs
{
    public class RaceHub : Hub
    {
        private readonly RaceService _raceService;
        private readonly ILogger<RaceHub> _logger;

        public RaceHub(RaceService raceService, ILogger<RaceHub> logger)
        {
            _raceService = raceService;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
            _raceService.RemovePlayer(Context.ConnectionId);
            await Clients.All.SendAsync("PlayerLeft", Context.ConnectionId);
            await Clients.All.SendAsync("UpdatePlayers", _raceService.GetPlayers().ToList());
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinRace(string username)
        {
            _logger.LogInformation("Player joining race: {Username} with connection ID: {ConnectionId}", 
                username, Context.ConnectionId);

            _raceService.AddPlayer(Context.ConnectionId, username);

            await Clients.All.SendAsync("PlayerJoined",
                new { id = Context.ConnectionId, username = username, progress = 0 });
            await Clients.All.SendAsync("UpdatePlayers", _raceService.GetPlayers().ToList());
        }

        public async Task SetReady()
        {
            _logger.LogInformation("Player ready: {ConnectionId}", Context.ConnectionId);
            _raceService.SetPlayerReady(Context.ConnectionId);
            await Clients.All.SendAsync("UpdatePlayers", _raceService.GetPlayers().ToList());

            if (_raceService.AreAllPlayersReady())
            {
                _logger.LogInformation("All players ready, starting race");
                await Clients.All.SendAsync("AllPlayersReady");
                _raceService.StartRace();

                for (int i = 3; i > 0; i--)
                {
                    await Clients.All.SendAsync("Countdown", i);
                    await Task.Delay(1000);
                }

                await Clients.All.SendAsync("RaceStarted", _raceService.CurrentText);
                await Clients.All.SendAsync("StartTyping", _raceService.CurrentText);
            }
        }

        public async Task SendProgress(double progress)
        {
            double prevRankCount = _raceService.GetRanking().Count();
            _raceService.UpdatePlayerProgress(Context.ConnectionId, progress);
            await Clients.All.SendAsync("ReceiveProgress", Context.ConnectionId, progress);
            
            if (_raceService.GetRanking().Count() > prevRankCount)
            {
                var rankingPlayers = _raceService.GetRankingPlayers().ToList();
                await Clients.All.SendAsync("RankingUpdated", rankingPlayers);
            }
        }
    }
}