using Microsoft.AspNetCore.SignalR;

namespace signalrBackend.Hubs
{
    public class VotingHub : Hub
    {
        private static Dictionary<string, int> _votes = new Dictionary<string, int>
        {
            { "Islam", 0 },
            { "Khabib", 0 },
            { "Ferguson", 0 }
        };

        public override async Task OnConnectedAsync()
        {
            await Clients.All.SendAsync("ReceiveVoteResults", _votes);
            await base.OnConnectedAsync();
        }

        public async Task SubmitVote(string fighter)
        {
            if (_votes.ContainsKey(fighter))
            {
                _votes[fighter]++;
                await Clients.All.SendAsync("ReceiveVoteResults", _votes);
            }
        }
    }
} 