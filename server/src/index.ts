import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

let clients: any[] = [];

wss.on("connection", (socket) => {
  console.log("New client connected");

  clients.push(socket);

  socket.on("message", (msg) => {
    const data = msg.toString();

    clients.forEach((client) => {
      if (client !== socket && client.readyState === 1) {
        client.send(data);
      }
    });
  });

  socket.on("close", () => {
    clients = clients.filter((c) => c !== socket);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});