const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const socket = require("socket.io");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const server = http.createServer(app);
const port = process.env.PORT || 3000;
const redis = require("redis");

const io = socket(server);


const publicDirectoryPath = path.join(__dirname, "public");
app.use(express.static(publicDirectoryPath));

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  getPublicRooms,
} = require("./utils/users");

// // Check if Redis is connected
// redisClient.on("connect", () => {
//   console.log("Redis connected");
// });

// // Check if Redis connection encountered an error
// redisClient.on("error", (error) => {
//   console.error("Redis connection error:", error);
// });

io.on("connection", (socket) => {
  console.log("New websocket connection");
  console.log("socket id is : ", socket.id);

  socket.on("join", async (options, callback) => {
    console.log("opppp", options);
    const { error, user } = await addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }
    console.log("userrrrrr", user);
    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin", `${user.username} has joined`));
    // console.log("in this room", user.room);

    // Update the roomData for all users in the public room
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: await getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", async (message, callback) => {
    const user = await getUser(socket.id);
    console.log("inside sendMess", user);
    if (user && user.room.startsWith("public")) {
      io.to(user.room).emit("message", generateMessage(user.username, message));
      callback("acknowledged from server");
    } else {
      // Emit the message to users in the private room
      io.to(user.room).emit("message", generateMessage(user.username, message));
    }
  });

  socket.on("sendLocation", async (coords, callback) => {
    const user = await getUser(socket.id);
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

  socket.on("disconnect", async () => {
    const user = await removeUser(socket.id);
    // if (user && user.room.startsWith("public")) {
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: await getUsersInRoom(user.room),
      });

      // Delete the public room if it becomes empty
      const publicRoomsList = await getPublicRooms();
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
