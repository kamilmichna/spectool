import { WebSocket, WebSocketServer } from "ws";

function createWsServer(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  function broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  return { wss, broadcast };
}

export { createWsServer };
