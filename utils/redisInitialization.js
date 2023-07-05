// const redis = require("redis");
const redis = require("ioredis");

const redisClient = redis.createClient({
  // host: process.env.REDIS_ENDPOINT, // Redis server host
  host: "localhost",
  port: 6379, // Redis server port
});

function usersInitialization() {
  redisClient.exists("users", (error, result) => {
    if (error) {
      console.error("Error:", error);
    } else {
      if (result === 1) {
        console.log("Key exists.");
      } else {
        const users = [];
        const serializedUsersArray = JSON.stringify(users);

        redisClient.set("users", serializedUsersArray, (error, result) => {
          if (error) {
            console.error("Error:", error);
          } else {
            console.log("Array stored successfully:", result);
          }
        });
        console.log("Key does not exist.");
      }
    }
  });
}

function publicRoomsInitialization() {
  redisClient.exists("publicRooms", (error, result) => {
    if (error) {
      console.error("Error:", error);
    } else {
      if (result === 1) {
        console.log("Key exists.");
      } else {
        const publicRooms = {};
        const serializedPublicRoomsArray = JSON.stringify(publicRooms);

        redisClient.set(
          "publicRooms",
          serializedPublicRoomsArray,
          (error, result) => {
            if (error) {
              console.error("Error:", error);
            } else {
              console.log("Array stored successfully:", result);
            }
          }
        );
        console.log("Key does not exist.");
      }
    }
  });
}

function privateRoomsInitialization() {
  redisClient.exists("privateRooms", (error, result) => {
    if (error) {
      console.error("Error:", error);
    } else {
      if (result === 1) {
        console.log("Key exists.");
      } else {
        const privateRooms = {};
        const serializedPublicRoomsArray = JSON.stringify(privateRooms);

        redisClient.set(
          "privateRooms",
          serializedPublicRoomsArray,
          (error, result) => {
            if (error) {
              console.error("Error:", error);
            } else {
              console.log("Array stored successfully:", result);
            }
          }
        );
        console.log("Key does not exist.");
      }
    }
  });
}

function roomEntityInitialization() {
  redisClient.exists("roomEntity", (error, result) => {
    if (error) {
      console.error("Error:", error);
    } else {
      if (result === 1) {
        console.log("Key exists.");
      } else {
        const rooms = {};
        const serializedRooms = JSON.stringify(rooms);

        redisClient.set("roomEntity", serializedRooms, (error, result) => {
          if (error) {
            console.error("Error:", error);
          } else {
            console.log("Array stored successfully location:", result);
          }
        });
        console.log("Key does not exist.");
      }
    }
  });
}

module.exports = {
  usersInitialization,
  publicRoomsInitialization,
  privateRoomsInitialization,
  roomEntityInitialization,
};
