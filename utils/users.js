// const redis = require("redis");
const redis = require("ioredis");
const {
  usersInitialization,
  publicRoomsInitialization,
} = require("./redisInitialization.js");

const util = require("util");

const redisClient = redis.createClient({
  // host: process.env.REDIS_ENDPOINT, // Redis server host
  host: "localhost",
  port: 6379, // Redis server port
});


redisClient.get("users", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("result is here ", result);
    if (!result) {
      usersInitialization();
    }
  }
});

redisClient.get("publicRooms", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("rrrrrrrrr", result);
    if (!result) {
      publicRoomsInitialization();
    }
  }
});

redisClient.get = util.promisify(redisClient.get);

const getFromRedis = async (key) => {
  try {
    console.log("the keyyyyyyy ", key);
    const result = await redisClient.get(key);
    const data = JSON.parse(result);
    console.log("Retrieved array:", key, data);
    return data;
  } catch (error) {
    console.error("Error retrieving array from Redis:", error);
    throw error;
  }
};

const addUser = async ({ id, username, private, room }) => {
  console.log(room);
  // Clean the data
  username = username.trim().toLowerCase();

  // Validate the data
  if (!username) {
    return {
      error: "Username is required!",
    };
  }

  // Find or create the public room with the most empty slots
  let _room = null;
  if (private) {
    _room = await findOrCreatePrivateRoom(room);
  } else {
    _room = await findOrCreatePublicRoom();
  }

  console.log("room we got : ", _room);

  const users = await getFromRedis("users");

  console.log("users : ", users);

  // Store the user
  const user = { id, username, room: _room };

  // Check for existing user with the same username in the specified room
  const existingUser = users.find((user) => {
    console.log("inside existing user: ", user);
    console.log("inside existing user: ", _room);
    return user.room === _room && user.username === username;
  });

  if (existingUser) {
    return {
      error: "Username is already taken in this room.",
    };
  }

  users.push(user);

  const serializedUsersArray = JSON.stringify(users);

  redisClient.set("users", serializedUsersArray, (error, result) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Array stored successfully: 1", result);
    }
  });

  const publicRooms = await getFromRedis("publicRooms");
  console.log("hggtghghg", publicRooms);

  // Add the user to the public room
  publicRooms[_room].push(user);
  const serializedPublicRoomsArray = JSON.stringify(publicRooms);

  redisClient.set(
    "publicRooms",
    serializedPublicRoomsArray,
    (error, result) => {
      if (error) {
        console.error("Error:", error);
      } else {
        console.log("Array stored successfully: 2", result);
      }
    }
  );

  console.log("checkkkk  ", Object.keys(publicRooms));

  return { user };
};

const findOrCreatePrivateRoom = async (roomName) => {
  const publicRooms = await getFromRedis("publicRooms");

  if (!publicRooms[roomName]) {
    console.log("============================");
    publicRooms[roomName] = [];
    const serializedPublicRoomsArray = JSON.stringify(publicRooms);

    redisClient.set(
      "publicRooms",
      serializedPublicRoomsArray,
      (error, result) => {
        if (error) {
          console.error("Error:", error);
        } else {
          console.log("Array stored successfully: 3", result);
        }
      }
    );
  }
  return roomName;
};

const findOrCreatePublicRoom = async () => {
  const publicRooms = await getFromRedis("publicRooms");
  const maxRoomUsers = 3; // Set the maximum number of users per public room
  console.log("cccccccccc", publicRooms);
  // Find a public room with empty slots
  const availableRoom = Object.keys(publicRooms).find(
    (room) => publicRooms[room].length < maxRoomUsers
  );

  // console.log("avail room", availableRoom);
  // console.log("before : ", publicRooms);

  if (availableRoom) {
    return availableRoom; // Return the room with empty slots
  }

  // Create a new public room
  const room = await generateRoomName();
  publicRooms[room] = [];

  const serializedPublicRoomsArray = JSON.stringify(publicRooms);

  redisClient.set(
    "publicRooms",
    serializedPublicRoomsArray,
    (error, result) => {
      if (error) {
        console.error("Error:", error);
      } else {
        console.log("Array stored successfully: 4", result);
      }
    }
  );

  console.log("ppp", publicRooms);

  return room;
};

const generateRoomName = async () => {
  const publicRooms = await getFromRedis("publicRooms");
  // Generate a unique room name
  let room = "publicroom";
  let count = 1;
  while (publicRooms.hasOwnProperty(room + count)) {
    count++;
  }
  return room + count;
};

const getUser = async (id) => {
  const users = await getFromRedis("users");

  return users.find((user) => user.id === id);
};

// Function to get users in a specific room
const getUsersInRoom = async (room) => {
  const users = await getFromRedis("users");
  return users.filter((user) => user.room === room);
};

const removeUser = async (id) => {
  const users = await getFromRedis("users");
  const publicRooms = await getFromRedis("publicRooms");

  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    const user = users.splice(index, 1)[0];

    // Remove the user from the public room
    const roomUsers = publicRooms[user.room];
    if (roomUsers) {
      const userIndex = roomUsers.findIndex((u) => u.id === id);
      if (userIndex !== -1) {
        roomUsers.splice(userIndex, 1);
        if (roomUsers.length === 0) {
          delete publicRooms[user.room];
        }
      }
    }

    const serializedUsersArray = JSON.stringify(users);

    redisClient.set("users", serializedUsersArray, (error, result) => {
      if (error) {
        console.error("Error:", error);
      } else {
        console.log("Array stored successfully: 5", result);
      }
    });

    const serializedPublicRoomsArray = JSON.stringify(publicRooms);

    redisClient.set(
      "publicRooms",
      serializedPublicRoomsArray,
      (error, result) => {
        if (error) {
          console.error("Error:", error);
        } else {
          console.log("Array stored successfully: 6", result);
        }
      }
    );

    return user;
  }
};

const getPublicRooms = async () => {
  const publicRooms = await getFromRedis("publicRooms");
  const publicRoomsList = [];

  for (const room in publicRooms) {
    const occupancy = publicRooms[room].length;
    publicRoomsList.push({ room, occupancy });
  }
  // console.log("pun room list : ", publicRoomsList);

  return publicRoomsList;
};

module.exports = {
  addUser,
  getUser,
  removeUser,
  getUsersInRoom,
  getPublicRooms,
};
