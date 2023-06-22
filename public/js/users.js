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

// addUser({
//   id: 1,
//   username: " maina   ",
//   room: "  1abc ",
// });

// addUser({
//   id: 10,
//   username: " mike   ",
//   room: "  1abc ",
// });

// addUser({
//   id: 11,
//   username: " john   ",
//   room: "  xyz ",
// });
// console.log(users);

// const res = addUser({
//   id: "10",
//   username: "maina",
//   room: "1abc",
// });

// console.log(res);
// const removedUser = removeUser(1);
// console.log(removedUser);
// console.log(users);

// console.log(getUser(1));
// console.log(getUsersInRoom("1abc"));

module.exports = {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser,
};
