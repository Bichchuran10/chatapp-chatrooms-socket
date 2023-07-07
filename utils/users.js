// const redis = require("redis");
const redis = require("ioredis");
const {
  usersInitialization,
  publicRoomsInitialization,
  privateRoomsInitialization,
  roomEntityInitialization,
} = require("./redisInitialization.js");

const util = require("util");

const redisClient = redis.createClient({
  host: process.env.REDIS_ENDPOINT, // Redis server host
  // host: "localhost",
  port: 6379, // Redis server port
});

redisClient.get("users", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("rrrrrrrrr users", result);
    if (!result) {
      usersInitialization();
    }
  }
});

redisClient.get("publicRooms", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("rrrrrrrrr publicrooms", result);
    if (!result) {
      publicRoomsInitialization();
    }
  }
});
redisClient.get("privateRooms", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("rrrrrrrrr privaterooms", result);
    if (!result) {
      privateRoomsInitialization();
    }
  }
});
redisClient.get("roomEntity", (error, result) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("rrrrrrrrr roomEntity", result);
    if (!result) {
      roomEntityInitialization();
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

const addUser = async ({ id, username, private, room, locations }) => {
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
    _room = await findOrCreatePublicRoom(locations);
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
    user = { id, username, room: _room, private: false, place: locations };
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
    const roomEntity = await getFromRedis("roomEntity");
    const publicRooms = await getFromRedis("publicRooms");
    console.log("hggtghghg", publicRooms);

    // Add the user to the public room
    publicRooms[_room].push(user);

    // Update the roomEntity map
    if (roomEntity[locations]) {
      roomEntity[locations][_room] = publicRooms[_room];
    } else {
      roomEntity[locations] = {
        [_room]: publicRooms[_room],
      };
    }

    const serializedPublicRoomsArray = JSON.stringify(publicRooms);
    const serializedRoomEntity = JSON.stringify(roomEntity);

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

    redisClient.set("roomEntity", serializedRoomEntity, (error, result) => {
      if (error) {
        console.error("Error:", error);
      } else {
        console.log("roomEntity map stored successfully", result);
      }
    });

    roomEntityMap = await getFromRedis("roomEntity");

    console.log("room entityyyyyyyyyyy", roomEntityMap);
  }

  return { user };
};

const findOrCreatePrivateRoom = async (roomName) => {
  const privateRooms = await getFromRedis("privateRooms");
  const publicRooms = await getFromRedis("publicRooms");

  if (!privateRooms[roomName]) {
    console.log("============================");

    // if (!privateRooms.hasOwnProperty(roomName)) {
    //   console.log("check pass for no existing privateroom name");
    //   if (publicRooms.hasOwnProperty(roomName)) {
    //     console.log("check for publicRooms if exists already");
    //     return {
    //       error: "Room name already exists as a public room.",
    //     };
    //   }

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

const findOrCreatePublicRoom = async (locations) => {
  const publicRooms = await getFromRedis("publicRooms");
  const maxRoomUsers = 3; // Set the maximum number of users per public room

  // Filter public rooms based on the specified location
  const filteredRooms = Object.keys(publicRooms).filter((room) => {
    // Extract the location from the room name (assuming the room name format is "publicroom-location")
    const roomLocation = room.split("-")[1];
    return roomLocation === locations;
  });

  // Sort the filtered rooms based on additional criteria (e.g., creation time, total users)
  const sortedRooms = filteredRooms.sort((roomA, roomB) => {
    // Compare additional criteria here
    // For example, if you want to prioritize rooms with fewer total users:
    const totalUsersA = publicRooms[roomA].length;
    const totalUsersB = publicRooms[roomB].length;
    return totalUsersA - totalUsersB;
  });

  // Find the first room with empty slots from the sorted rooms
  const availableRoom = sortedRooms.find((room) => {
    return publicRooms[room].length < maxRoomUsers;
  });

  if (availableRoom) {
    return availableRoom; // Return the room with empty slots
  }

  // Create a new public room in the specified location
  const room = await generateRoomName(locations);
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

const generateRoomName = async (locations) => {
  const { v4: uuidv4 } = require("uuid");
  return "publicroom-" + locations + "-" + uuidv4();
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
  const roomEntity = await getFromRedis("roomEntity");
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
      console.log("removing the user from the public room...");
      const roomUsers = publicRooms[user.room];
      console.log("what is roomUsers .......", roomUsers);

      if (roomUsers) {
        const userIndex = roomUsers.findIndex((u) => u.id === id);

        if (userIndex !== -1) {
          roomUsers.splice(userIndex, 1);

          console.log(
            "deleted the user from publicRooms and updated roomUsers ....",
            roomUsers
          );

          // Check if the public room is empty and delete it from publicRooms if necessary
          if (roomUsers.length === 0) {
            console.log(
              "The public room is empty, deleting it from publicRooms..."
            );
            delete publicRooms[user.room];
          }

          // Remove the user from roomEntity
          const location = user.place;
          console.log("Removing the user from roomEntity...");
          if (roomEntity[location] && roomEntity[location][user.room]) {
            const roomIndex = roomEntity[location][user.room].findIndex(
              (u) => u.id === id
            );
            if (roomIndex !== -1) {
              roomEntity[location][user.room].splice(roomIndex, 1);

              console.log("User deleted from roomEntity successfully");

              // Check if the room is empty and delete it from roomEntity if necessary
              if (roomEntity[location][user.room].length === 0) {
                console.log(
                  "The room is empty, deleting it from roomEntity..."
                );
                delete roomEntity[location][user.room];
              }

              // Check if the location has any remaining rooms and delete the location if empty
              if (Object.keys(roomEntity[location]).length === 0) {
                console.log(
                  "The location is empty, deleting it from roomEntity..."
                );
                delete roomEntity[location];
              }
            }
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

      const serializedRoomEntity = JSON.stringify(roomEntity);
      redisClient.set("roomEntity", serializedRoomEntity, (error, result) => {
        if (error) {
          console.error("Error:", error);
        } else {
          console.log("roomEntity stored successfully", result);
        }
      });

      return user;
    }
  }
};

module.exports = {
  addUser,
  getUser,
  removeUser,
  getUsersInRoom,
};
