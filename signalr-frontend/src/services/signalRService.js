import * as signalR from '@microsoft/signalr';

class SignalRService {
    constructor() {
        this.connection = null;
        this.pendingHandlers = new Map();
        this.isConnected = false;
    }

    async startConnection() {
        try {
            if (this.connection) {
                await this.connection.stop();
            }

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl('http://localhost:5050/raceHub', {
                    skipNegotiation: false,
                    transport: signalR.HttpTransportType.WebSockets,
                    withCredentials: true
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
                .configureLogging(signalR.LogLevel.Debug)
                .build();

            // Add connection event handlers
            this.connection.onclose(async () => {
                console.log('Connection closed');
                this.isConnected = false;
                // Try to reconnect after a delay
                setTimeout(() => this.startConnection(), 5000);
            });

            this.connection.onreconnecting((error) => {
                console.log('Reconnecting...', error);
                this.isConnected = false;
            });

            this.connection.onreconnected((connectionId) => {
                console.log('Reconnected. ConnectionId:', connectionId);
                this.isConnected = true;
                // Re-add all pending handlers
                this.pendingHandlers.forEach((handler, methodName) => {
                    this.connection.on(methodName, handler);
                });
            });

            await this.connection.start();
            console.log('SignalR Connected successfully');
            this.isConnected = true;

            // Add all pending handlers
            this.pendingHandlers.forEach((handler, methodName) => {
                this.connection.on(methodName, handler);
            });
            this.pendingHandlers.clear();

        } catch (error) {
            console.error('SignalR Connection Error: ', error);
            this.isConnected = false;
            throw error;
        }
    }

    async stopConnection() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.isConnected = false;
        }
    }

    addHandler(methodName, handler) {
        if (this.isConnected && this.connection) {
            this.connection.on(methodName, handler);
        } else {
            this.pendingHandlers.set(methodName, handler);
        }
    }

    removeHandler(methodName, handler) {
        if (this.connection) {
            this.connection.off(methodName, handler);
        }
        this.pendingHandlers.delete(methodName);
    }

    async invoke(methodName, ...args) {
        if (!this.isConnected || !this.connection) {
            throw new Error('SignalR connection is not established');
        }
        return await this.connection.invoke(methodName, ...args);
    }

    async joinRace(username) {
        if (!this.connection) {
            throw new Error('Not connected to SignalR');
        }
        await this.connection.invoke('JoinRace', username);
    }

    async setReady() {
        if (!this.connection) {
            throw new Error('Not connected to SignalR');
        }
        await this.connection.invoke('SetReady');
    }

    async sendProgress(correctCharacters) {
        if (!this.connection) {
            throw new Error('Not connected to SignalR');
        }
        await this.connection.invoke('SendProgress', correctCharacters);
    }
}

export const signalRService = new SignalRService(); 