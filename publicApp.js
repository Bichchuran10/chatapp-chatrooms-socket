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
  getPublicRooms,
} = require("./utils/publicUsers");
const server = http.createServer(app);
const port = process.env.PORT || 3000;

const io = socket(server);

// Serve static files from the "public" directory
const publicDirectoryPath = path.join(__dirname, "public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New websocket connection");
  console.log("socket id is : ", socket.id);

  socket.on("join", (options, callback) => {
    console.log("opppp", options);
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    console.log("hahahhhahhaa user", user);

    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} has joined`));
    console.log("in this room", user.room);
    // Update the public rooms and assign the user to a room with the most empty slot

    // Update the roomData for all users in the public room
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    console.log("inside sendMess", user);
    if (user && user.room.startsWith("public")) {
      io.to(user.room).emit("message", generateMessage(user.username, message));
      callback("acknowledged from server");
    } else {
      // Emit the message to users in the private room
      io.to(user.room).emit("message", generateMessage(user.username, message));
    }
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    if (user && user.room.startsWith("public")) {
      io.to(user.room).emit(
        "locationMessage",
        generateLocationMessage(
          user.username,
          `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        )
      );
      callback();
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    // if (user && user.room.startsWith("public")) {
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });

      // Delete the public room if it becomes empty
      const publicRoomsList = getPublicRooms();
      const roomIndex = publicRoomsList.findIndex(
        (room) => room.room === user.room
      );
      if (roomIndex !== -1) {
        const room = publicRoomsList[roomIndex];
        if (room.occupancy === 0) {
          publicRoomsList.splice(roomIndex, 1);
        }
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
