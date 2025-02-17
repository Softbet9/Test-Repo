const express = require("express");
let app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoutes = require("./Routes/auth");
const userManagementRoutes = require("./Routes/userManagement");
const thirdPartyRoutes = require("./Routes/thirdParty");
const transctionManagementRoutes = require("./Routes/transactionManagement");
const analysis = require("./Routes/matchAnalysis");
const declaration = require("./Routes/declaration");
const matches = require("./Routes/matches");
const game = require("./Routes/game");
const status = require("express-status-monitor")();
const cron = require("node-cron");
const moment = require("moment");
const { saveMatchesCricket } = require("./Controllers/thirdPartyController");
const { autoDeclare } = require("./Controllers/autoMatchResult");

dotenv.config();
mongoose
  .connect(process.env.MONGO_URL, {})
  .then(() => console.log("DB Connected Successful"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(status);
app.use(cors());
app.use(cookieParser());
 

app.get("/", (req, res) => {
  res.send({ Hi: "tested ok " });
});
app.get('/autoDeclare',autoDeclare);
app.use("/api/auth", authRoutes);
app.use("/api/users", userManagementRoutes);
app.use("/api/t-p", thirdPartyRoutes);
app.use("/api/transactions", transctionManagementRoutes);
app.use("/api/declare", declaration);
app.use("/api/matches", matches);
app.use("/api/game", game); 
app.use("/api/analysis", analysis);
app.listen(process.env.PORT, () => {
  console.log("Backend Server is Running on PORT ", process.env.PORT);
});

cron.schedule("* * * * *", () => {
  console.log('cron started');
  saveMatchesCricket();
});


cron.schedule("*/5 * * * *", () => {
  console.log('Cron job started');
  autoDeclare();
});
