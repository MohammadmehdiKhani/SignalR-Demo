using Microsoft.AspNetCore.SignalR;

namespace signalrBackend.Hubs
{
    public class CounterHub : Hub
    {
        private static int _counter = 0;

        public override async Task OnConnectedAsync()
        {
            _counter++;
            await Clients.All.SendAsync("UpdateCounter", _counter);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _counter--;
            await Clients.All.SendAsync("UpdateCounter", _counter);
            await base.OnDisconnectedAsync(exception);
        }
    }
}