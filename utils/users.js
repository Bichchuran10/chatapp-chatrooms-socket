const users = [];

const addUser = ({ id, username, room }) => {
  //clean the data
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  //validate the data
  if (!username || !room) {
    return {
      error: "username and room are required!",
    };
  }

  //check for existing user
  const existingUser = users.find((user) => {
    return user.room === room && user.username === username;
  });

  //validate username
  if (existingUser) {
    return {
      error: "Username is in use",
    };
  }

  //store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

//getuser
const getUser = (id) => {
  return users.find((user) => user.id === id);
};

//getUsersInRoom
const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase();
  return users.filter((user) => user.room === room);
};

const removeUser = (id) => {
  const index = users.findIndex((user) => {
    return user.id === id;
  });
  if (index !== -1) {
    //match found
    return users.splice(index, 1)[0]; //remove item,no of items we want to remove[user obj that's removed]
  }
};

addUser({
  id: 1,
  username: " maina   ",
  room: "  1abc ",
});

addUser({
  id: 10,
  username: " mike   ",
  room: "  1abc ",
});

addUser({
  id: 11,
  username: " john   ",
  room: "  xyz ",
});
console.log(users);

const res = addUser({
  id: "10",
  username: "maina",
  room: "1abc",
});

console.log(res);
const removedUser = removeUser(1);
console.log(removedUser);
console.log(users);

console.log(getUser(1));
console.log(getUsersInRoom("1abc"));

module.exports = {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
};

// const users = [];
// const publicRooms = {};

// const addUser = ({ id, username, room }) => {
//   // Clean the data
//   username = username.trim().toLowerCase();
//   room = room.trim().toLowerCase();

//   // Validate the data
//   if (!username || !room) {
//     return {
//       error: "Username and room are required!",
//     };
//   }

//   // Check if the room is public
//   const isPublicRoom = room.startsWith("public");

//   // Check for existing user with the same username in the same public room
//   if (isPublicRoom) {
//     const existingUser = users.find(
//       (user) => user.room === room && user.username === username
//     );
//     if (existingUser) {
//       return {
//         error: "Username is already taken in this room.",
//       };
//     }
//   }

//   // Check if the room is full (reached the maximum limit)
//   if (isPublicRoom) {
//     const maxRoomUsers = 3; // Set the maximum number of users per public room
//     if (!publicRooms[room]) {
//       publicRooms[room] = [];
//     }
//     if (publicRooms[room].length >= maxRoomUsers) {
//       return {
//         error: "This room is already full.",
//       };
//     }
//   }

//   // Store the user
//   const user = { id, username, room };
//   users.push(user);

//   // Add the user to the public room if it's a public room
//   if (isPublicRoom) {
//     publicRooms[room].push(user);
//   }

//   return { user };
// };

// const getUser = (id) => {
//   return users.find((user) => user.id === id);
// };

// const getUsersInRoom = (room) => {
//   room = room.trim().toLowerCase();
//   return users.filter((user) => user.room === room);
// };

// const removeUser = (id) => {
//   const index = users.findIndex((user) => user.id === id);
//   if (index !== -1) {
//     const user = users.splice(index, 1)[0];

//     // Remove the user from the public room if it's a public room
//     if (user.room.startsWith("public")) {
//       const roomUsers = publicRooms[user.room];
//       if (roomUsers) {
//         const userIndex = roomUsers.findIndex((u) => u.id === id);
//         if (userIndex !== -1) {
//           roomUsers.splice(userIndex, 1);
//           if (roomUsers.length === 0) {
//             delete publicRooms[user.room];
//           }
//         }
//       }
//     }

//     return user;
//   }
// };

// const getPublicRooms = () => {
//   const publicRoomsList = [];

//   for (const room in publicRooms) {
//     const occupancy = publicRooms[room].length;
//     publicRoomsList.push({ room, occupancy });
//   }

//   return publicRoomsList;
// };

// module.exports = {
//   addUser,
//   getUser,
//   getUsersInRoom,
//   removeUser,
//   getPublicRooms,
// };
