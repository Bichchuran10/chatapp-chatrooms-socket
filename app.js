const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const socket = require("socket.io");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
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

  socket.emit("message", generateMessage("Welcome!"));
  socket.broadcast.emit("message", generateMessage("a new user has joined"));

  socket.on("sendMessage", (message, callback) => {
    io.emit("message", generateMessage(message));
    callback("Delivered");
  });
  //   });
  socket.on("sendLocation", (coords, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
    );
    callback();
  });
  socket.on("disconnect", () => {
    io.emit("message", generateMessage("a user has disconnected"));
  });
});
// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
