namespace signalrBackend.Models
{
    public class Player
    {
        public string Username { get; set; }
        public bool IsReady { get; set; }
        public double Progress { get; set; }
        public static int TotalCharacters { get; set; }
    }
} 