import * as signalR from '@microsoft/signalr';

class SignalRService {
    constructor() {
        this.baseUrl = 'http://localhost:5050';
        this.connection = null;
        this.handlers = new Map();
    }

    async startConnection() {
        if (this.connection) {
            return;
        }

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${this.baseUrl}/raceHub`, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .build();

        try {
            console.log('Attempting to connect to:', `${this.baseUrl}/raceHub`);
            await this.connection.start();
            console.log('SignalR Connected successfully');
        } catch (error) {
            console.error('Error creating connection:', error);
            this.connection = null;
            throw error;
        }
    }

    async stopConnection() {
        if (this.connection) {
            try {
                await this.connection.stop();
            } catch (error) {
                console.error('Error stopping connection:', error);
            }
            this.connection = null;
        }
    }

    addHandler(methodName, handler) {
        if (this.connection) {
            this.connection.on(methodName, handler);
            this.handlers.set(methodName, handler);
        }
    }

    async invoke(methodName, ...args) {
        if (!this.connection) {
            throw new Error('No connection available');
        }
        return await this.connection.invoke(methodName, ...args);
    }

    async sendProgress(progress) {
        if (!this.connection) {
            throw new Error('No connection available');
        }
        await this.connection.invoke('SendProgress', progress);
    }
}

export default new SignalRService(); 