namespace signalrBackend.Models
{
    public class Player
    {
        public string Username { get; set; }
        public bool IsReady { get; set; }
        public double Progress { get; set; }
        public string ConnectionId { get; set; }
    }
} 