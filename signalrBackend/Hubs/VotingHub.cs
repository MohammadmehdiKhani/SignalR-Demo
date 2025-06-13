using Microsoft.AspNetCore.SignalR;
using signalrBackend.Services;

namespace signalrBackend.Hubs
{
    public class VotingHub : Hub
    {
        private static VotingService _votingService;
        public VotingHub(VotingService votingService)
        {
            _votingService = votingService;
        }

        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("ReceiveVoteResults", _votingService.GetVotingResults());
            await base.OnConnectedAsync();
        }

        public async Task SubmitVote(string fighter)
        {
            _votingService.AddVote(fighter);
            await Clients.All.SendAsync("ReceiveVoteResults", _votingService.GetVotingResults());
        }
    }
} 