const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const socket = require("socket.io");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");
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
  // socket.emit("message", generateMessage("Welcome back!")); //socket.emit sends it to a specific client
  // socket.broadcast.emit("message", generateMessage("a new user has joined")); //sends it to every connected client except for this one

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    console.log("hahahaa user : ", user);

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("Welcome!")); //socket.emit sends it to a specific client
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined`)); //sends it to every connected client in that room except for this one

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    io.emit("message", generateMessage(message)); //io.emit -> sends it to every connected client
    callback("Delivered");
  });
  //   });
  socket.on("sendLocation", (coords, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`)
      );
    }
  });
});
// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
