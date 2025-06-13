using System.Collections.Concurrent;

namespace signalrBackend.Services;

public class VotingService
{
    private readonly ConcurrentDictionary<string, int> _votingResults = new();

    public VotingService()
    {
        _votingResults.TryAdd("Islam", 0);
        _votingResults.TryAdd("Khabib", 0);
        _votingResults.TryAdd("Ferguson", 0);
    }

    public void AddVote(string option)
    {
        _votingResults.AddOrUpdate(option, 1, (key, oldValue) => oldValue + 1);
    }

    public IReadOnlyDictionary<string, int> GetVotingResults()
    {
        return _votingResults;
    }

    public void ResetVotes()
    {
        foreach (var key in _votingResults.Keys)
        {
            _votingResults[key] = 0;
        }
    }
}