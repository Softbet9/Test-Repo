
const { liveCricketMatches, upcommingCricketMatches,inplayMatchesForAllSports, completedCricketMatches,getMatchDetails, matchesBlocking } = require("../Controllers/matches");
const verify = require("../Middleware/verifyJWT");
  
  const router = require("express").Router();
  router.get("/getLiveMatches/:sportId", liveCricketMatches);
  router.post("/blockingMatch", matchesBlocking);
  router.get("/getInplayMatches", inplayMatchesForAllSports);
  router.get("/getUpcommingMatches/4", upcommingCricketMatches);
  router.get("/getCompletedMatches/4", completedCricketMatches);
  router.get("/getMatchDetails/:matchId", getMatchDetails);
  
  module.exports = router;
  