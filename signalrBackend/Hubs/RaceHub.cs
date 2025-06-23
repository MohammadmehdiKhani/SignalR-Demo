using Microsoft.AspNetCore.SignalR;
using signalrBackend.Models;
using signalrBackend.Services;
using Microsoft.Extensions.Logging;

namespace signalrBackend.Hubs
{
    public class RaceHub : Hub
    {
        private readonly RoomManager _roomManager;
        private readonly ILogger<RaceHub> _logger;

        public RaceHub(RoomManager roomManager, ILogger<RaceHub> logger)
        {
            _roomManager = roomManager;
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
            // Remove player from all rooms they might be in
            var activeRooms = _roomManager.GetActiveRooms();
            foreach (var roomId in activeRooms)
            {
                var raceService = _roomManager.GetOrCreateRoom(roomId);
                if (raceService.GetPlayers().Any(p => p.ConnectionId == Context.ConnectionId))
                {
                    raceService.RemovePlayer(Context.ConnectionId);
                    await Clients.Group(roomId).SendAsync("PlayerLeft", Context.ConnectionId);
                    await Clients.Group(roomId).SendAsync("UpdatePlayers", raceService.GetPlayers().ToList());
                    // If room is empty, remove it
                    if (raceService.GetPlayers().Count == 0)
                    {
                        _roomManager.RemoveRoom(roomId);
                    }
                    break;
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinRoom(string roomId)
        {
            var username = Context.User?.Identity?.Name ?? "Anonymous";
            _logger.LogInformation("Player joining room: {RoomId}, Username: {Username} with connection ID: {ConnectionId}", roomId, username, Context.ConnectionId);
            var raceService = _roomManager.GetOrCreateRoom(roomId);
            raceService.AddPlayer(Context.ConnectionId, username);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.Group(roomId).SendAsync("PlayerJoined", new { id = Context.ConnectionId, username = username, progress = 0 });
            await Clients.Group(roomId).SendAsync("UpdatePlayers", raceService.GetPlayers().ToList());
        }

        public async Task SetReady(string roomId)
        {
            var username = Context.User?.Identity?.Name ?? "Anonymous";
            _logger.LogInformation("Player ready in room {RoomId}: {Username} ({ConnectionId})", roomId, username, Context.ConnectionId);
            var raceService = _roomManager.GetOrCreateRoom(roomId);
            raceService.SetPlayerReady(Context.ConnectionId);
            await Clients.Group(roomId).SendAsync("UpdatePlayers", raceService.GetPlayers().ToList());
            if (raceService.AreAllPlayersReady())
            {
                _logger.LogInformation("All players ready in room {RoomId}, starting race", roomId);
                await Clients.Group(roomId).SendAsync("AllPlayersReady");
                raceService.StartRace();
                for (int i = 3; i > 0; i--)
                {
                    await Clients.Group(roomId).SendAsync("Countdown", i);
                    await Task.Delay(1000);
                }
                await Clients.Group(roomId).SendAsync("RaceStarted", raceService.CurrentText);
                await Clients.Group(roomId).SendAsync("StartTyping", raceService.CurrentText);
            }
        }

        public async Task SendProgress(string roomId, double progress)
        {
            var raceService = _roomManager.GetOrCreateRoom(roomId);
            raceService.UpdatePlayerProgress(Context.ConnectionId, progress);
            await Clients.Group(roomId).SendAsync("ReceiveProgress", Context.ConnectionId, progress);
            if (progress >= 100)
            {
                var rankingPlayers = raceService.GetRankingPlayers().ToList();
                await Clients.Group(roomId).SendAsync("RankingUpdated", rankingPlayers);
                if (raceService.AreAllPlayersFinished())
                {
                    await Clients.Group(roomId).SendAsync("RaceEnded", rankingPlayers);
                    raceService.ResetRace();
                }
            }
        }

        public async Task EndRace(string roomId)
        {
            var raceService = _roomManager.GetOrCreateRoom(roomId);
            var rankingPlayers = raceService.GetRankingPlayers().ToList();
            await Clients.Group(roomId).SendAsync("RaceEnded", rankingPlayers);
            raceService.ResetRace();
        }

        public async Task LeaveRoom(string roomId)
        {
            var raceService = _roomManager.GetOrCreateRoom(roomId);
            raceService.RemovePlayer(Context.ConnectionId);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
            await Clients.Group(roomId).SendAsync("PlayerLeft", Context.ConnectionId);
            await Clients.Group(roomId).SendAsync("UpdatePlayers", raceService.GetPlayers().ToList());
            if (raceService.GetPlayers().Count == 0)
            {
                _roomManager.RemoveRoom(roomId);
            }
        }

        public async Task GetRoomInfo(string roomId)
        {
            if (_roomManager.RoomExists(roomId))
            {
                var raceService = _roomManager.GetOrCreateRoom(roomId);
                await Clients.Caller.SendAsync("RoomInfo", new
                {
                    roomId = roomId,
                    players = raceService.GetPlayers(),
                    currentText = raceService.CurrentText,
                    isRaceStarted = raceService.IsRaceStarted,
                    isCountdownStarted = raceService.IsCountdownStarted
                });
            }
            else
            {
                await Clients.Caller.SendAsync("RoomNotFound", roomId);
            }
        }

        public async Task GetActiveRooms()
        {
            var activeRooms = _roomManager.GetActiveRooms();
            await Clients.Caller.SendAsync("ActiveRooms", activeRooms);
        }
    }
} 