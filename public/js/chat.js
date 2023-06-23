// const socket = io();

// //Elements
// const $messageForm = document.querySelector("#message-form");
// const $messageFormInput = $messageForm.querySelector("input");
// const $messageFormButton = $messageForm.querySelector("button");
// const $sendLocationButton = document.querySelector("#send-location");
// const $messages = document.querySelector("#messages");

// //Templates
// const messageTemplate = document.querySelector("#message-template").innerHTML;
// const locationMessageTemplate = document.querySelector(
//   "#location-message-template"
// ).innerHTML;
// const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
// //Options
// const { username, room } = Qs.parse(location.search, {
//   ignoreQueryPrefix: true,
// });

// //scrolling
// const autoScroll = () => {
//   //new message element
//   const $newMessage = $messages.lastElementChild;

//   //height of new message
//   const newMessageStyle = getComputedStyle($newMessage);
//   const newMessageMargin = parseInt(newMessageStyle.marginBottom);
//   const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

//   //visible height
//   const visibleHeight = $messages.offsetHeight;

//   //height of container messages
//   const containerHeight = $messages.scrollHeight;

//   //how far have i scrolled
//   const scrollOffset = $messages.scrollTop + visibleHeight;
//   console.log("visible height is: ", visibleHeight);
//   console.log("scrollOffset is", scrollOffset);
//   console.log("containerHeight is", containerHeight);
//   console.log("newMessageHeight is", newMessageHeight);

//   if (containerHeight - newMessageHeight <= scrollOffset) {
//     console.log("autoscroll is on");
//     $messages.scrollTop = $messages.scrollHeight;
//   }
// };

// socket.on("connect", () => {
//   console.log("userrrrrr", socket.id); // x8WIv7-mJelg7on_ALbx
// });

// socket.on("message", (message) => {
//   console.log(message); // world
//   const html = Mustache.render(messageTemplate, {
//     username: message.username,
//     message: message.text,
//     createdAt: moment(message.createdAt).format("h:mm a"),
//   });
//   $messages.insertAdjacentHTML("beforeend", html);
//   autoScroll();
// });

// socket.on("locationMessage", (message) => {
//   console.log(message);
//   const html = Mustache.render(locationMessageTemplate, {
//     username: message.username,
//     url: message.url,
//     createdAt: moment(message.createdAt).format("h:m a"),
//   });
//   $messages.insertAdjacentHTML("beforeend", html);
//   autoScroll();
// });

// socket.on("roomData", ({ room, users }) => {
//   // console.log(room);
//   // console.log(users);
//   const html = Mustache.render(sidebarTemplate, {
//     room,
//     users,
//   });
//   document.querySelector("#sidebar").innerHTML = html;
// });

// $messageForm.addEventListener("submit", (e) => {
//   e.preventDefault();

//   $messageFormButton.setAttribute("disabled", "disabled");

//   const message = e.target.message.value;

//   socket.emit("sendMessage", message, (message) => {
//     $messageFormButton.removeAttribute("disabled");
//     $messageFormInput.value = "";
//     $messageFormInput.focus();
//     console.log("The message was delivered", message);
//   });
// });

// $sendLocationButton.addEventListener("click", () => {
//   if (!navigator.geolocation) {
//     return alert("geolocation is not suported in your browser");
//   }
//   $sendLocationButton.setAttribute("disabled", "disabled");

//   navigator.geolocation.getCurrentPosition((position) => {
//     console.log(position);

//     socket.emit(
//       "sendLocation",
//       {
//         latitude: position.coords.latitude,
//         longitude: position.coords.longitude,
//       },
//       () => {
//         $sendLocationButton.removeAttribute("disabled");
//         console.log("location shared");
//       }
//     );
//   });
// });

// socket.emit("join", { username, room }, (error) => {
//   if (error) {
//     alert(error);
//     location.href = "./";
//   }
// });

const socket = io();

// Elements
const chatForm = document.querySelector("#message-form");
const chatInput = chatForm.querySelector("input");
const sendLocationButton = document.querySelector("#send-location");
const messagesContainer = document.querySelector("#messages");
const sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Functions
const autoScroll = () => {
  // Scroll to the bottom of the messages container
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

// Event listeners
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = e.target.elements.message.value;

  if (message) {
    // Emit the sendMessage event to the server
    socket.emit("sendMessage", message, (ack) => {
      // Acknowledgement from the server
      console.log("Acknowledgement:", ack);
      chatInput.value = "";
      chatInput.focus();
    });
  }
});

sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }

  sendLocationButton.disabled = true;
  sendLocationButton.textContent = "Sending...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Emit the sendLocation event to the server
      socket.emit("sendLocation", { latitude, longitude }, () => {
        sendLocationButton.disabled = false;
        sendLocationButton.textContent = "Send location";
      });
    },
    (error) => {
      alert("Unable to retrieve your location.");
      sendLocationButton.disabled = false;
      sendLocationButton.textContent = "Send location";
    }
  );
});

// Socket events
socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    createdAt: moment(message.createdAt).format("h:mm a"),
    message: message.text,
  });
  messagesContainer.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (locationMessage) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: locationMessage.username,
    createdAt: moment(locationMessage.createdAt).format("h:mm a"),
    url: locationMessage.url,
  });
  messagesContainer.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  sidebar.innerHTML = html;
});

// Join a room
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
