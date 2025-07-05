import * as signalR from '@microsoft/signalr';
import authService from './authService';

class SignalRService {
    constructor() {
        this.connections = new Map();
        this.pendingHandlers = new Map();
        this.isConnected = false;
    }

    async startConnection(hubName) {
        try {
            if (this.connections.has(hubName)) {
                await this.connections.get(hubName).stop();
            }

            const token = authService.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`http://localhost:5050/${hubName}?access_token=${token}`, {
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets,
                    withCredentials: true
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
                .configureLogging(signalR.LogLevel.Debug)
                .build();

            // Add connection event handlers
            connection.onclose(async () => {
                console.log(`${hubName} connection closed`);
                this.isConnected = false;
                // Try to reconnect after a delay
                setTimeout(() => this.startConnection(hubName), 5000);
            });

            connection.onreconnecting((error) => {
                console.log(`${hubName} reconnecting...`, error);
                this.isConnected = false;
            });

            connection.onreconnected((connectionId) => {
                console.log(`${hubName} reconnected. ConnectionId:`, connectionId);
                this.isConnected = true;
            });

            await connection.start();
            console.log(`${hubName} SignalR Connected successfully`);
            this.isConnected = true;
            this.connections.set(hubName, connection);

        } catch (error) {
            console.error(`${hubName} SignalR Connection Error: `, error);
            this.isConnected = false;
            throw error;
        }
    }

    async stopConnection(hubName) {
        if (this.connections.has(hubName)) {
            await this.connections.get(hubName).stop();
            this.connections.delete(hubName);
            this.isConnected = false;
        }
    }

    async stopAllConnections() {
        for (const [hubName, connection] of this.connections) {
            await connection.stop();
        }
        this.connections.clear();
        this.isConnected = false;
    }

    addHandler(hubName, methodName, handler) {
        const connection = this.connections.get(hubName);
        if (connection && this.isConnected) {
            connection.on(methodName, handler);
        } else {
            if (!this.pendingHandlers.has(hubName)) {
                this.pendingHandlers.set(hubName, new Map());
            }
            this.pendingHandlers.get(hubName).set(methodName, handler);
        }
    }

    removeHandler(hubName, methodName, handler) {
        const connection = this.connections.get(hubName);
        if (connection) {
            connection.off(methodName, handler);
        }
        
        const hubHandlers = this.pendingHandlers.get(hubName);
        if (hubHandlers) {
            hubHandlers.delete(methodName);
        }
    }

    async invoke(hubName, methodName, ...args) {
        const connection = this.connections.get(hubName);
        if (!this.isConnected || !connection) {
            throw new Error(`${hubName} SignalR connection is not established`);
        }
        return await connection.invoke(methodName, ...args);
    }

    // Race Hub specific methods - Updated for Room system
    async createRoom(roomId) {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        // For now, we'll use joinRoom for both create and join since the backend handles room creation automatically
        await connection.invoke('JoinRoom', roomId);
    }

    async joinRoom(roomId) {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        await connection.invoke('JoinRoom', roomId);
    }

    async leaveRoom(roomId) {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        await connection.invoke('LeaveRoom', roomId);
    }

    async getActiveRooms() {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        await connection.invoke('GetActiveRooms');
    }

    async getRoomInfo(roomId) {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        await connection.invoke('GetRoomInfo', roomId);
    }

    async setReady(roomId) {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        await connection.invoke('SetReady', roomId);
    }

    async sendProgress(roomId, correctCharacters) {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        await connection.invoke('SendProgress', roomId, correctCharacters);
    }

    async endRace(roomId) {
        const connection = this.connections.get('raceHub');
        if (!connection) {
            throw new Error('Not connected to Race Hub');
        }
        await connection.invoke('EndRace', roomId);
    }
}

export const signalRService = new SignalRService(); 