const socket = io();

socket.on("connect", () => {
  console.log("userrrrrr", socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("message", (arg) => {
  console.log(arg); // world
});

document.querySelector("#message-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = e.target.message.value;
  socket.emit("sendMessage", message);
});

document.querySelector("#send-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("geolocation is not suported in your browser");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position);
    socket.emit("sendLocation", {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  });
});
