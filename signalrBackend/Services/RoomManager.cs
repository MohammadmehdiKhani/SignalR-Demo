using signalrBackend.Models;

namespace signalrBackend.Services
{
    public class RoomManager
    {
        private readonly Dictionary<string, RaceService> _rooms = new();
        private readonly object _lockObject = new object();

        public RaceService GetOrCreateRoom(string roomId)
        {
            lock (_lockObject)
            {
                if (!_rooms.ContainsKey(roomId))
                {
                    _rooms[roomId] = new RaceService();
                }
                return _rooms[roomId];
            }
        }

        public bool RoomExists(string roomId)
        {
            lock (_lockObject)
            {
                return _rooms.ContainsKey(roomId);
            }
        }

        public void RemoveRoom(string roomId)
        {
            lock (_lockObject)
            {
                if (_rooms.ContainsKey(roomId))
                {
                    _rooms.Remove(roomId);
                }
            }
        }

        public List<string> GetActiveRooms()
        {
            lock (_lockObject)
            {
                return _rooms.Keys.ToList();
            }
        }
    }
} 