using signalrBackend.Models;
using System.IO;

namespace signalrBackend.Services
{
    public class RaceService
    {
        private readonly Dictionary<string, Player> _players = new();
        private readonly List<string> _ranking = new();
        private static readonly string SentencesFilePath = Path.Combine(Directory.GetCurrentDirectory(), "sentences.txt");
        private static List<string> _sentences;
        private static readonly object _sentencesLock = new object();

        public string CurrentText { get; private set; }
        public bool IsRaceStarted { get; private set; }
        public bool IsCountdownStarted { get; private set; }

        public RaceService()
        {
            EnsureSentencesLoaded();
            SetNewText();
        }

        public void SetNewText()
        {
            EnsureSentencesLoaded();
            if (_sentences != null && _sentences.Count > 0)
            {
                var rnd = new Random();
                CurrentText = _sentences[rnd.Next(_sentences.Count)].Trim();
            }
            else
            {
                CurrentText = "No sentences available. Please add sentences to sentences.txt.";
            }
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

        private void EnsureSentencesLoaded()
        {
            if (_sentences == null)
            {
                lock (_sentencesLock)
                {
                    if (_sentences == null)
                    {
                        if (File.Exists(SentencesFilePath))
                        {
                            _sentences = File.ReadAllLines(SentencesFilePath)
                                .Where(line => !string.IsNullOrWhiteSpace(line))
                                .ToList();
                        }
                        else
                        {
                            _sentences = new List<string>();
                        }
                    }
                }
            }
        }
    }
} 