// const redis = require("redis");
const redis = require("ioredis");
const {
  usersInitialization,
  publicRoomsInitialization,
  privateRoomsInitialization,
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
redisClient.get("privateRooms", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("rrrrrrrrr", result);
    if (!result) {
      privateRoomsInitialization();
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
  console.log("_room is : ", _room);
  console.log("privateeeee checkk", private);

  //checking for similar roomnames in publicrooms
  const publicRooms = await getFromRedis("publicRooms");
  if (private && publicRooms.hasOwnProperty(room)) {
    return {
      error: "Room name already exists as a public room.",
    };
  }

  console.log("room check pass");
  if (private) {
    console.log("inside private rooms");
    _room = await findOrCreatePrivateRoom(room);
  } else {
    console.log("inside pubbbbbbbb");
    _room = await findOrCreatePublicRoom();
  }

  console.log("room we got : ", _room);

  const users = await getFromRedis("users");

  console.log("users : ", users);

  let user = null;
  // Store the user
  if (private) {
    console.log("storing private user starts here......", private);
    user = { id, username, room: _room, private: true };
  } else {
    console.log("storing public user starts here......", private);
    user = { id, username, room: _room, private: false };
  }

  console.log("the user we got ....", user);

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

  if (private) {
    console.log("storing in private rooms......");
    const privateRooms = await getFromRedis("privateRooms");
    // Add the user to the private room
    privateRooms[_room].push(user);

    //serialize
    const serializedPrivateRoomsArray = JSON.stringify(privateRooms);
    redisClient.set(
      "privateRooms",
      serializedPrivateRoomsArray,
      (error, result) => {
        if (error) {
          console.error("Error:", error);
        } else {
          console.log("Array stored successfully: 2", result);
        }
      }
    );
  } else {
    console.log("storing in public rooms......");
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
  } // console.log("checkkkk  ", Object.keys(publicRooms));

  return { user };
};

const findOrCreatePrivateRoom = async (roomName) => {
  const privateRooms = await getFromRedis("privateRooms");
  const publicRooms = await getFromRedis("publicRooms");

  if (!privateRooms[roomName]) {
    console.log("============================");
    privateRooms[roomName] = [];
    const serializedPublicRoomsArray = JSON.stringify(privateRooms);

    redisClient.set(
      "privateRooms",
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
  console.log("inside find/create publicroom", publicRooms);

  // Find a public room with the most empty slots
  const availableRoom = Object.keys(publicRooms).reduce((maxRoom, room) => {
    console.log(
      "checking for empty slots... length: ",
      publicRooms[room].length
    );
    const emptySlots = maxRoomUsers - publicRooms[room].length;
    const maxEmptySlots = maxRoom
      ? maxRoomUsers - publicRooms[maxRoom].length
      : 0;
    return emptySlots > maxEmptySlots ? room : maxRoom;
  }, null);

  // availableRoom will contain the public room with the most empty slots

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
  const { v4: uuidv4 } = require("uuid");
  return "publicroom-" + uuidv4();
};

const getUser = async (id) => {
  const users = await getFromRedis("users");

  return users.find((user) => user.id === id);
};

// Function to get users in a specific room
const getUsersInRoom = async (room) => {
  const users = await getFromRedis("users");
  console.log("gettting users in room :", users);
  return users.filter((user) => user.room === room);
};

const removeUser = async (id) => {
  const users = await getFromRedis("users");
  const privateRooms = await getFromRedis("privateRooms");
  const publicRooms = await getFromRedis("publicRooms");
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    const user = users.splice(index, 1)[0];
    console.log("remobvingggggggggg", user);
    if (user.private) {
      // Remove the user from the private rooms

      console.log("removing the user from private room.......");
      const roomUsers = privateRooms[user.room];
      if (roomUsers) {
        const userIndex = roomUsers.findIndex((u) => u.id === id);
        if (userIndex !== -1) {
          roomUsers.splice(userIndex, 1);
          if (roomUsers.length === 0) {
            console.log("deleteing the private room itself......");
            delete privateRooms[user.room];
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

      const serializedPrivateRoomsArray = JSON.stringify(privateRooms);

      redisClient.set(
        "privateRooms",
        serializedPrivateRoomsArray,
        (error, result) => {
          if (error) {
            console.error("Error:", error);
          } else {
            console.log("Array stored successfully: 6", result);
          }
        }
      );

      return user;
    } else {
      // Remove the user from the public room
      console.log("removing the user from public room");
      const roomUsers = publicRooms[user.room];
      if (roomUsers) {
        const userIndex = roomUsers.findIndex((u) => u.id === id);
        if (userIndex !== -1) {
          roomUsers.splice(userIndex, 1);
          if (roomUsers.length === 0) {
            console.log("deleting the public room itself.....");
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
  }
};

// const getPublicRooms = async () => {
//   const publicRooms = await getFromRedis("publicRooms");
//   const publicRoomsList = [];

//   for (const room in publicRooms) {
//     const occupancy = publicRooms[room].length;
//     publicRoomsList.push({ room, occupancy });
//   }
//   // console.log("pun room list : ", publicRoomsList);

//   return publicRoomsList;
// };

module.exports = {
  addUser,
  getUser,
  removeUser,
  getUsersInRoom,
  // getPublicRooms,
};
