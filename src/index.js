const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("../service_account.json");

//Create server
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const httpServer = http.createServer(app);

//Initialize firebase admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://whatsapp-clone-81009-default-rtdb.firebaseio.com",
});
const databaseInstance = admin.database();

const socketOptions = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
};
const io = require("socket.io")(httpServer, socketOptions);

io.on("connection", (socket) => {
  const id = socket.handshake.query.id;
  socket.join(id);

  socket.on("send-message", ({ messageId, recipientId, text }) => {
    socket.broadcast
      .to(recipientId)
      .emit("receive-message", { messageId, senderId: id, text: text });
  });
});

app.get("/api/getAllUsers", async (req, res) => {
  // Get a database reference to our posts
  const ref = databaseInstance.ref("/online");
  try {
    const resultFromDb = (await ref.get()).val();
    const requestArray = [];
    for (userId in resultFromDb) {
      requestArray.push({ uid: userId });
    }

    const usersInfo = await admin.auth().getUsers(requestArray);
    const responseArray = usersInfo.users.map((item) => ({
      uid: item.uid,
      email: item.email,
      isOnline: resultFromDb[item.uid],
    }));
    res.send(responseArray);
  } catch (err) {
    res.send(err).status(500);
  }
});

httpServer.listen(5000);
