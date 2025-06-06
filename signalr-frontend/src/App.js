import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import './App.css';

function App() {
  const [counter, setCounter] = useState(0);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5050/counterhub')
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Connected to SignalR Hub');
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      connection.on('UpdateCounter', (count) => {
        setCounter(count);
      });

      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Live Client Counter</h1>
        <div className="counter">
          <h2>{counter}</h2>
          <p>Connected Clients</p>
        </div>
      </header>
    </div>
  );
}

export default App;
