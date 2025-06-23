import { useEffect, useState } from "react";
import { signalRService } from "../services/signalRService";
import "./ClientCounter.css";

const ClientCounter = () => {
  const [counter, setCounter] = useState(0);
  const [clickCounter, setClickCounter] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  useEffect(() => {
    const startConnection = async () => {
      try {
        setConnectionStatus("Connecting");
        await signalRService.startConnection("clientCounterHub");
        setConnectionStatus("Connected");

        // Add handlers
        signalRService.addHandler("clientCounterHub", "UpdateLiveClientCounter", (count) => {
          setCounter(count);
        });

        signalRService.addHandler("clientCounterHub", "UpdateClickCounter", (count) => {
          setClickCounter(count);
        });

      } catch (error) {
        console.error("SignalR Connection Error: ", error);
        setConnectionStatus("Disconnected");
      }
    };

    startConnection();

    return () => {
      signalRService.stopConnection("clientCounterHub");
    };
  }, []);

  const handleClick = async () => {
    try {
      await signalRService.invoke("clientCounterHub", "SomebodyClicked");
    } catch (error) {
      console.error("Error calling somebodyClicked:", error);
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