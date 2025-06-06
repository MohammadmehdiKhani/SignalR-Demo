using Microsoft.AspNetCore.SignalR;

namespace signalrBackend.Hubs
{
    public class CounterHub : Hub
    {
        private static int _liveConnectionCounter = 0;
        private static int _clickCounter = 0;
        
        public override async Task OnConnectedAsync()
        {
            _liveConnectionCounter++;
            await Clients.All.SendAsync("UpdateLiveClientCounter", _liveConnectionCounter);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _liveConnectionCounter--;
            await Clients.All.SendAsync("UpdateLiveClientCounter", _liveConnectionCounter);
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SomebodyClicked()
        {
            _clickCounter++;
            await Clients.All.SendAsync("UpdateClickCounter", _clickCounter);
        }
    }
}