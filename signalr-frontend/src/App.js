import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import "./App.css";

function App() {
  const [counter, setCounter] = useState(0);
  const [clickCounter, setClickCounter] = useState(0);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5050/counterhub")
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("Connected to SignalR Hub");
        })
        .catch((err) => console.error("SignalR Connection Error: ", err));

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
        await connection.invoke("SomebodyClicked"); // Call the hub method
      } catch (error) {
        console.error("Error calling somebodyClicked:", error);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Live Client Counter</h1>
        <div className="counter">
          <h2>{counter}</h2>
          <p>Connected Clients</p>
        </div>

        <button className="click-me-btn" onClick={handleClick}>
          Click Me!
        </button>
        <div>Click counter: {clickCounter}</div>
      </header>
    </div>
  );
}

export default App;
