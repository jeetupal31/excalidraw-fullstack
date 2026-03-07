import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Excalidraw backend running");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

let clients: WebSocket[] = [];

wss.on("connection", (socket:WebSocket) => {
  console.log("New WebSocket connection");

  clients.push(socket);

  socket.on("message", (message) => {
    const data =  message.toString();

    console.log("Received drawing data");

    // Broadcast to all other clients
    clients.forEach((client) => {
      if(client !== socket && client.readyState === WebSocket.OPEN) {
      client.send(data);
      }
    })
  });

  socket.on("close", () => {
    clients = clients.filter((clients) => clients !== socket);
  });
});