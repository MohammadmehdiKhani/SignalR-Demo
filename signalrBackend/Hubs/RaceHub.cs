using Microsoft.AspNetCore.SignalR;
using signalrBackend.Models;
using signalrBackend.Services;

namespace signalrBackend.Hubs
{
    public class RaceHub : Hub
    {
        private readonly RaceService _raceService;

        public RaceHub(RaceService raceService)
        {
            _raceService = raceService;
        }

        public async Task JoinRace(string username)
        {
            _raceService.AddPlayer(Context.ConnectionId, username);

            await Clients.All.SendAsync("PlayerJoined",
                new { id = Context.ConnectionId, name = username, progress = 0 });
            await Clients.All.SendAsync("UpdatePlayers", _raceService.GetPlayers().ToList());
        }

        public async Task SetReady()
        {
            _raceService.SetPlayerReady(Context.ConnectionId);
            await Clients.All.SendAsync("UpdatePlayers",
                _raceService.GetPlayers().ToList());

            if (_raceService.AreAllPlayersReady())
            {
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
                await Clients.All.SendAsync("RankingUpdated", _raceService.GetRanking().ToList());
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _raceService.RemovePlayer(Context.ConnectionId);
            await Clients.All.SendAsync("PlayerLeft", Context.ConnectionId);
            await Clients.All.SendAsync("UpdatePlayers",
                _raceService.GetPlayers().ToList());
            await base.OnDisconnectedAsync(exception);
        }
    }
}