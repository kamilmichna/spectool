export function connectWs({ onMessage }) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const url = `${protocol}://${window.location.host}/ws`;
  const socket = new WebSocket(url);

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onMessage) {
        onMessage(data);
      }
    } catch (err) {
      console.warn("Invalid WS message", err);
    }
  });

  return socket;
}
