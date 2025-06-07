import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import "./ClientCounter.css";

const ClientCounter = () => {
  const [counter, setCounter] = useState(0);
  const [clickCounter, setClickCounter] = useState(0);
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5050/clientCounterHub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      setConnectionStatus("Connecting");
      connection
        .start()
        .then(() => {
          console.log("Connected to SignalR Hub");
          setConnectionStatus("Connected");
        })
        .catch((err) => {
          console.error("SignalR Connection Error: ", err);
          setConnectionStatus("Disconnected");
        });

      connection.on("UpdateLiveClientCounter", (count) => {
        setCounter(count);
      });

      connection.on("UpdateClickCounter", (count) => {
        setClickCounter(count);
      });

      return () => {
        connection.stop();
      };
    }
  }, [connection]);

  const handleClick = async () => {
    if (connection) {
      try {
        await connection.invoke("SomebodyClicked");
      } catch (error) {
        console.error("Error calling somebodyClicked:", error);
      }
    }
  };

  const getStatusDotClass = () => {
    switch (connectionStatus.toLowerCase()) {
      case 'connected':
        return 'status-dot connected';
      case 'disconnected':
        return 'status-dot disconnected';
      default:
        return 'status-dot connecting';
    }
  };

  return (
    <div className="client-counter">
      <h2>Live Client Counter</h2>
      <div className="counter">
        <h3>{counter}</h3>
        <p>Connected Clients</p>
      </div>

      <button className="click-me-btn" onClick={handleClick}>
        Click Me!
      </button>
      <div className="click-counter">Click counter: {clickCounter}</div>
      <div className="connection-status">
        <span className={getStatusDotClass()}></span>
        {connectionStatus}
      </div>
    </div>
  );
};

export default ClientCounter; 