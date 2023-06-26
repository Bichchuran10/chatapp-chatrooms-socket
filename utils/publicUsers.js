const users = [];
const publicRooms = {};

const addUser = ({ id, username, private, room }) => {
  console.log(room);
  // Clean the data
  username = username.trim().toLowerCase();

  // Validate the data
  if (!username) {
    return {
      error: "Username is required!",
    };
  }

  // Check for existing user with the same username
  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return {
      error: "Username is already taken.",
    };
  }
  // Find or create the public room with the most empty slots
  let _room = null;
  if (private) {
    _room = findOrCreatePrivateRoom(room);
  } else {
    _room = findOrCreatePublicRoom();
  }

  // Store the user
  const user = { id, username, room: _room };
  users.push(user);

  // Add the user to the public room
  publicRooms[_room].push(user);
  console.log("the user : ", user);
  console.log("the users : ", users);
  console.log("the public rooms", publicRooms);

  return { user };
};

const findOrCreatePrivateRoom = (roomName) => {
  if (!publicRooms[roomName]) {
    console.log("============================");
    publicRooms[roomName] = [];
  }
  return roomName;
};

const findOrCreatePublicRoom = () => {
  const maxRoomUsers = 3; // Set the maximum number of users per public room

  // Find a public room with empty slots
  const availableRoom = Object.keys(publicRooms).find(
    (room) => publicRooms[room].length < maxRoomUsers
  );

  console.log("avail room", availableRoom);
  console.log("before : ", publicRooms);

  if (availableRoom) {
    return availableRoom; // Return the room with empty slots
  }

  // Create a new public room
  const room = generateRoomName();
  publicRooms[room] = [];

  console.log("ppp", publicRooms);

  return room;
};

const generateRoomName = () => {
  // Generate a unique room name
  let room = "publicroom";
  let count = 1;
  while (publicRooms.hasOwnProperty(room + count)) {
    count++;
  }
  return room + count;
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

// Function to get users in a specific room
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

const removeUser = (id) => {
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

    return user;
  }
};

const getPublicRooms = () => {
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
