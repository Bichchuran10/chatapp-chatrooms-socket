const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const socket = require("socket.io");
const server = http.createServer(app);
const port = process.env.port || 3000;

const io = socket(server);

// Serve static files from the "public" directory
const publicDirectoryPath = path.join(__dirname, "public");
app.use(express.static(publicDirectoryPath));

// app.get("/", function (req, res) {
//   res.send("Hello World");
// });

io.on("connection", (socket) => {
  console.log("New websocket connection");
  socket.emit("message", "welcome!");
  socket.broadcast.emit("message", "a new user has joined");
  socket.on("sendMessage", (message, callback) => {
    io.emit("message", message);
    callback("Delivered");
  });
  //   });
  socket.on("sendLocation", (coords,callback) => {
    io.emit(
      "message",
      `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
    );
    callback()
  });
  socket.on("disconnect", () => {
    io.emit("message", "a user has disconnected");
  });
});
// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
