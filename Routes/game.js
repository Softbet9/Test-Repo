const {
  getGame,
  updateStatus,
  getFancyPy,
  CreateGame
} = require("../Controllers/gameController");
const verify = require("../Middleware/verifyJWT");

const router = require("express").Router();
router.get("/getGames", getGame);
router.post("/updateStatus", updateStatus);
router.post("/getFancyPy", getFancyPy);
router.post("/createGame", CreateGame);

module.exports = router;
