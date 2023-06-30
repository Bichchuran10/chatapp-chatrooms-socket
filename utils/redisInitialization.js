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

module.exports = {
  usersInitialization,
  publicRoomsInitialization,
};
