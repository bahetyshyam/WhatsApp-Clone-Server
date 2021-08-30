const express = require("express");
const cors = require("cors");
const http = require("http");
const options = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
};

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = require("socket.io")(httpServer, options);

io.on("connection", (socket) => {
  const id = socket.handshake.query.id;
  console.log(id);
  socket.join(id);

  socket.on("send-message", ({ recipientId, text }) => {
    socket.broadcast
      .to(recipientId)
      .emit("receive-message", { sender: id, text: text });
  });
});

app.use("/", (req, res) => res.send("Hello wrold"));

httpServer.listen(5000);
