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
const { username, room, private } = Qs.parse(location.search, {
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
  console.log(
    "jkadsbkflsfjsaasjlsAJSFa roomdataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa***"
  );
  console.log("showinggg roomdata room", room);
  console.log("showinggg roomdata users", users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  sidebar.innerHTML = html;
});

// Join a room
socket.emit("join", { username, room, private }, (error) => {
  console.log(username);
  console.log(room);
  console.log(private);

  if (error) {
    alert(error);
    location.href = "/";
  }
});

//new edition------------------------------------
// Client-side code
socket.on("roomData", (data) => {
  console.log("Received roomData:", data);
});