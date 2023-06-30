// const express = require("express");
// const http = require("http");
// const path = require("path");
// const app = express();
// const socket = require("socket.io");
// const redis = require("redis");
// const pubSubClient = redis.createClient();

// const {
//   generateMessage,
//   generateLocationMessage,
// } = require("./utils/messages");

// const server = http.createServer(app);
// const port = process.env.PORT || 3000;
// const redis = require("redis");

// const io = socket(server);

// const publicDirectoryPath = path.join(__dirname, "public");
// app.use(express.static(publicDirectoryPath));

// const {
//   addUser,
//   removeUser,
//   getUser,
//   getUsersInRoom,
//   getPublicRooms,
// } = require("./utils/users");

// // // Check if Redis is connected
// // redisClient.on("connect", () => {
// //   console.log("Redis connected");
// // });

// // // Check if Redis connection encountered an error
// // redisClient.on("error", (error) => {
// //   console.error("Redis connection error:", error);
// // });

// io.on("connection", (socket) => {
//   console.log("New websocket connection");
//   console.log("socket id is : ", socket.id);

//   socket.on("join", async (options, callback) => {
//     console.log("opppp", options);
//     const { error, user } = await addUser({ id: socket.id, ...options });

//     if (error) {
//       return callback(error);
//     }
//     console.log("userrrrrr", user);
//     socket.join(user.room);

//     socket.emit("message", generateMessage("Admin", "Welcome!"));
//     socket.broadcast
//       .to(user.room)
//       .emit("message", generateMessage("Admin", `${user.username} has joined`));
//     // console.log("in this room", user.room);

//     // Update the roomData for all users in the public room
//     io.to(user.room).emit("roomData", {
//       room: user.room,
//       users: await getUsersInRoom(user.room),
//     });

//     callback();
//   });

//   socket.on("sendMessage", async (message, callback) => {
//     const user = await getUser(socket.id);
//     console.log("inside sendMess", user);
//     if (user && user.room.startsWith("public")) {
//       io.to(user.room).emit("message", generateMessage(user.username, message));
//       callback("acknowledged from server");
//     } else {
//       // Emit the message to users in the private room
//       io.to(user.room).emit("message", generateMessage(user.username, message));
//     }
//   });

//   socket.on("sendLocation", async (coords, callback) => {
//     const user = await getUser(socket.id);
//     if (user && user.room.startsWith("public")) {
//       io.to(user.room).emit(
//         "locationMessage",
//         generateLocationMessage(
//           user.username,
//           `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
//         )
//       );
//       callback();
//     }
//   });

//   socket.on("disconnect", async () => {
//     const user = await removeUser(socket.id);
//     // if (user && user.room.startsWith("public")) {
//     if (user) {
//       io.to(user.room).emit(
//         "message",
//         generateMessage("Admin", `${user.username} has left!`)
//       );
//       io.to(user.room).emit("roomData", {
//         room: user.room,
//         users: await getUsersInRoom(user.room),
//       });

//       // Delete the public room if it becomes empty
//       const publicRoomsList = await getPublicRooms();
//       const roomIndex = publicRoomsList.findIndex(
//         (room) => room.room === user.room
//       );
//       if (roomIndex !== -1) {
//         const room = publicRoomsList[roomIndex];
//         if (room.occupancy === 0) {
//           publicRoomsList.splice(roomIndex, 1);
//         }
//       }
//     }
//   });
// });

// server.listen(port, () => {
//   console.log(`Server is running on port ${port}`);

const express = require("express");
const http = require("http");
const path = require("path");
const socket = require("socket.io");
const redis = require("ioredis");
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
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socket(server);

// Create separate Redis clients for publishing and subscribing
const pubClient = new redis({
  // host: "localhost",
  host: process.env.REDIS_ENDPOINT,
  port: 6379,
});
const subClient = new redis({
  // host: "localhost",
  host: process.env.REDIS_ENDPOINT,
  port: 6379,
});

io.adapter(
  require("socket.io-redis")({
    pubClient,
    subClient,
  })
);

const publicDirectoryPath = path.join(__dirname, "public");
app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("New websocket connection");
  console.log("Socket id is: ", socket.id);

  socket.on("join", async (options, callback) => {
    const { error, user } = await addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    console.log("before joining user ", user);
    socket.join(user.room);

    subClient.subscribe(user.room, async (err, count) => {
      if (err) {
        console.error("Error subscribing to Redis channel:", err);
      } else {
        console.log(`Subscribed to Redis channel: ${user.room}`);
        socket.emit("message", generateMessage("Admin", "Welcome!"));

        socket.broadcast
          .to(user.room)
          .emit(
            "message",
            generateMessage("Admin", `${user.username} has joined`)
          );
        // socket.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined`));

        console.log(
          `"${user.username} has joined" message emitted to room ${user.room}`
        );

        console.log("room data beforeeeeeee");
        // Emit the "roomData" event
        await emitRoomData(user.room);
        // const roomData = {
        //   room: user.room,
        //   users: await getUsersInRoom(user.room),
        // };
        // console.log("roomData:", roomData);
        // io.to(user.room).emit("roomData", roomData);

        callback();
      }
    });

    async function emitRoomData(room) {
      const roomData = {
        room,
        users: await getUsersInRoom(room),
      };

      console.log("got the dataa", roomData);
      console.log(`Emitting "roomData" event to room ${room}`);
      io.to(room).emit("roomData", roomData);
    }

    subClient.on("message", (channel, message) => {
      if (channel === user.room) {
        // Handle the message received from Redis channel
        const formattedMessage = JSON.parse(message);
        console.log("the form message SUB CLIENT", formattedMessage);
        // Emit the message to the connected socket
        socket.emit("message", formattedMessage);
      }
    });
  });

  socket.on("sendMessage", async (message, callback) => {
    const user = await getUser(socket.id);

    if (user && user.room.startsWith("public")) {
      const formattedMessage = generateMessage(user.username, message);
      pubClient.publish(
        user.room,
        JSON.stringify(formattedMessage),
        (err, reply) => {
          if (err) {
            console.error("Error publishing message:", err);
          } else {
            console.log("Message published:", reply);
          }
        }
      );
      callback("acknowledged from server");
    } else {
      io.to(user.room).emit("message", generateMessage(user.username, message));
    }
  });

  socket.on("sendLocation", async (coords, callback) => {
    const user = await getUser(socket.id);

    if (user && user.room.startsWith("public")) {
      const locationMessage = generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      );
      pubClient.publish(
        user.room,
        JSON.stringify(locationMessage),
        (err, reply) => {
          if (err) {
            console.error("Error publishing location message:", err);
          } else {
            console.log("Location message published:", reply);
          }
        }
      );
      callback("Location shared!");
    } else {
      io.to(user.room).emit(
        "locationMessage",
        generateLocationMessage(
          user.username,
          `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        )
      );
      callback("Location shared!");
    }
  });

  socket.on("disconnect", async () => {
    const user = await removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left`)
      );
      console.log(`${user.username} is leaving`);
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: await getUsersInRoom(user.room),
      });
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
