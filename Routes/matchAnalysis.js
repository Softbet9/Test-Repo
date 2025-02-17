const {
  getLiveMatchReport,
  sessionBets,
  declaredFancy,
  undeclaredFancy,
  matchBets,
  betSlips,
  sessionBetSlips,
} = require("../Controllers/analysisController");

const router = require("express").Router();

router.post("/getLiveMatchReport", getLiveMatchReport);
router.get("/sessionBets", sessionBets);
router.get("/declaredFancy", declaredFancy);
router.get("/undeclaredFancy", undeclaredFancy);
router.get("/matchBets", matchBets);
router.get("/getBetSlips", betSlips);
router.get("/getSessionBetSlips", sessionBetSlips);

module.exports = router;
