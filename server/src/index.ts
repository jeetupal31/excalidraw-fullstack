import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

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

wss.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("message", (message) => {
    console.log("Received:", message.toString());
  });

  socket.send("Connected to WebSocket server");
});