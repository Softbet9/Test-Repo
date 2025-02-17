const {
  placeBet,
  getAllBetsForTheMatch,
  getStatementOfAUser,
  placeOddsBet,
  placeFancyBet,
  getLastPositionForTheMatch,
  getSessionBets,
  getMatchesByUserBet,
  placeTossBet
} = require("../Controllers/betsController");
const verify = require("../Middleware/verifyJWT");

const router = require("express").Router();

//LOGIN
router.post("/getUserBetMatches", getMatchesByUserBet);
router.post("/place-bet", placeBet);
router.post("/place-odds-bet", placeOddsBet);
router.post("/place-toss-bet", placeTossBet);
router.post("/place-fancy-bet", placeFancyBet);
router.get("/getAllSessionBets", getSessionBets);
router.get("/getAllBetsOfCurrentMatch", getAllBetsForTheMatch);
router.get("/getStatementOfUser", getStatementOfAUser);
router.get("/getRecentPositionForTheMatch", getLastPositionForTheMatch);

module.exports = router;
