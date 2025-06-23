using signalrBackend.Models;

namespace signalrBackend.Services
{
    public class RaceService
    {
        private readonly Dictionary<string, Player> _players = new();
        private readonly string[] _sampleTexts = new[]
        {
            "The quick brown fox jumps over the lazy dog.",
            "Programming is the art of telling another human what one wants the computer to do.",
            "The best way to predict the future is to implement it yourself.",
            "Code is like humor. When you have to explain it, it's bad.",
            "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code."
        };
        private readonly List<string> _ranking = new();

        public string CurrentText { get; private set; }
        public bool IsRaceStarted { get; private set; }
        public bool IsCountdownStarted { get; private set; }

        public RaceService()
        {
            SetNewText();
        }

        public void SetNewText()
        {
            var random = new Random();
            CurrentText = _sampleTexts[random.Next(_sampleTexts.Length)];
        }

        public void AddPlayer(string connectionId, string username)
        {
            if (!_players.ContainsKey(connectionId))
            {
                _players.Add(connectionId, new Player { ConnectionId = connectionId, Username = username });
            }
        }

        public void RemovePlayer(string connectionId)
        {
            _players.Remove(connectionId);
        }

        public void SetPlayerReady(string connectionId)
        {
            if (_players.TryGetValue(connectionId, out var player))
            {
                player.IsReady = true;
            }
        }

        public void UpdatePlayerProgress(string connectionId, double progress)
        {
            if (_players.TryGetValue(connectionId, out var player))
            {
                player.Progress = progress;
                if (progress >= 100 && !_ranking.Contains(connectionId))
                {
                    _ranking.Add(connectionId);
                }
            }
        }

        public bool AreAllPlayersReady()
        {
            return _players.Count > 0 && _players.Values.All(p => p.IsReady);
        }

        public bool AreAllPlayersFinished()
        {
            return _players.Count > 0 && _players.Values.All(p => p.Progress >= 100);
        }

        public void StartRace()
        {
            IsRaceStarted = true;
            IsCountdownStarted = true;
        }

        public void ResetRace()
        {
            IsRaceStarted = false;
            IsCountdownStarted = false;
            foreach (var player in _players.Values)
            {
                player.IsReady = false;
                player.Progress = 0;
            }
            _ranking.Clear();
            SetNewText();
        }

        public List<Player> GetPlayers()
        {
            return _players.Values.ToList();
        }

        public IEnumerable<string> GetRanking() => _ranking;

        public IEnumerable<Player> GetRankingPlayers() => _ranking.Select(cid => _players.ContainsKey(cid) ? _players[cid] : null).Where(p => p != null);
    }
} 