using Microsoft.AspNetCore.SignalR;
using signalrBackend.Models;
using signalrBackend.Services;

namespace signalrBackend.Hubs
{
    public class RaceHub : Hub
    {
        private readonly RaceService _raceService;
        private static readonly Dictionary<string, string> _userConnections = new();

        public RaceHub(RaceService raceService)
        {
            _raceService = raceService;
        }

        public async Task JoinRace(string username)
        {
            _userConnections[Context.ConnectionId] = username;
            _raceService.AddPlayer(username);

            await Clients.All.SendAsync("PlayerJoined", new { id = Context.ConnectionId, name = username, progress = 0 });
            await Clients.All.SendAsync("UpdatePlayers",
                _userConnections.Select(kv => {
                    var player = _raceService.GetPlayers().FirstOrDefault(p => p.Username == kv.Value);
                    return new { id = kv.Key, Username = kv.Value, progress = player?.Progress ?? 0 };
                }).ToList());
        }

        public async Task SetReady()
        {
            if (_userConnections.TryGetValue(Context.ConnectionId, out var username))
            {
                _raceService.SetPlayerReady(username);
                await Clients.All.SendAsync("UpdatePlayers",
                    _userConnections.Select(kv => {
                        var player = _raceService.GetPlayers().FirstOrDefault(p => p.Username == kv.Value);
                        return new { id = kv.Key, Username = kv.Value, progress = player?.Progress ?? 0 };
                    }).ToList());

                if (_raceService.AreAllPlayersReady())
                {
                    await Clients.All.SendAsync("AllPlayersReady");
                    _raceService.StartRace();
                    
                    // Start countdown
                    for (int i = 3; i > 0; i--)
                    {
                        await Clients.All.SendAsync("Countdown", i);
                        await Task.Delay(1000);
                    }

                    await Clients.All.SendAsync("RaceStarted", _raceService.CurrentText);
                    await Clients.All.SendAsync("StartTyping", _raceService.CurrentText);
                }
            }
        }

        public async Task SendProgress(double progress)
        {
            if (_userConnections.TryGetValue(Context.ConnectionId, out var username))
            {
                double prevRankCount = _raceService.GetRanking().Count();
                _raceService.UpdatePlayerProgress(username, progress);
                await Clients.All.SendAsync("ReceiveProgress", Context.ConnectionId, progress);
                if (_raceService.GetRanking().Count() > prevRankCount)
                {
                    await Clients.All.SendAsync("RankingUpdated", _raceService.GetRanking().ToList());
                }
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (_userConnections.TryGetValue(Context.ConnectionId, out var username))
            {
                _raceService.RemovePlayer(username);
                _userConnections.Remove(Context.ConnectionId);
                await Clients.All.SendAsync("PlayerLeft", Context.ConnectionId);
                await Clients.All.SendAsync("UpdatePlayers",
                    _userConnections.Select(kv => {
                        var player = _raceService.GetPlayers().FirstOrDefault(p => p.Username == kv.Value);
                        return new { id = kv.Key, Username = kv.Value, progress = player?.Progress ?? 0 };
                    }).ToList());
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
} 