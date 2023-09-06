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

// const publicDirectoryPath = path.join(__dirname, "public");
// const publicDirectoryPath = path.join(__dirname, "public");
// app.use(express.static(publicDirectoryPath));
app.use(express.static(path.join(__dirname, "public")));

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

        const newUserJoinedMessage = generateMessage(
          "Admin",
          `${user.username} has joined`
        );

        pubClient.publish(
          user.room,
          JSON.stringify(newUserJoinedMessage),
          (err, reply) => {
            if (err) {
              console.error("Error publishing message:", err);
            } else {
              console.log("Message published:", reply);
            }
          }
        );

        console.log(
          `"${user.username} has joined" message emitted to room ${user.room}`
        );

        console.log("room data beforeeeeeee");
        // Emit the "roomData" event
        await emitRoomData(user.room);
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

      // Publish the roomData to the Redis channel
      pubClient.publish(
        room,
        JSON.stringify({ event: "roomData", data: roomData }),
        (err, reply) => {
          if (err) {
            console.error("Error publishing roomData:", err);
          } else {
            console.log("roomData published:", reply);
          }
        }
      );
    }

    subClient.on("message", (channel, message) => {
      console.log("asjdddfafdfsgfgffggffgfg channel", channel);
      if (channel === user.room) {
        // Handle the message received from Redis channel
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.event === "roomData") {
          // Emit the roomData event to the connected socket
          socket.emit("roomData", parsedMessage.data);
        } else {
          // Emit the message to the connected socket
          socket.emit("message", parsedMessage);
        }
      }
    });
  });

  socket.on("sendMessage", async (message, callback) => {
    const user = await getUser(socket.id);

    // if (user && user.room.startsWith("public")) {
    if (user) {
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
    }
    // } else {
    //   io.to(user.room).emit("message", generateMessage(user.username, message));
    // }
  });

  socket.on("disconnect", async () => {
    const user = await removeUser(socket.id);

    if (user) {
      console.log("on disconnect user:    ", user);
      const userLeftMessage = generateMessage(
        "Admin",
        `${user.username} has left`
      );
      console.log("the left msgb : ", userLeftMessage);
      const roomData = {
        room: user.room,
        users: await getUsersInRoom(user.room),
      };

      pubClient.publish(
        user.room,
        JSON.stringify(userLeftMessage),
        (err, reply) => {
          if (err) {
            console.error("Error publishing message:", err);
          } else {
            console.log("Message published:", reply);
          }
        }
      );

      console.log("updated room data after disconnecting .....", roomData);

      // Publish the roomData to the Redis channel
      pubClient.publish(
        user.room,
        JSON.stringify({ event: "roomData", data: roomData }),
        (err, reply) => {
          if (err) {
            console.error("Error publishing roomData:", err);
          } else {
            console.log("roomData published:", reply);
          }
        }
      );
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
