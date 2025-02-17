const {
  getData,
  getSeriesList,
  getAllMatchesList,
  getMarketList,
  getOdds,
  getRunners,
  bookMakerMarket,
  diamondFancy,
  getScore,
  getLiveTVURL,
  getFancyResult,
  updateMatchRunners,
  saveMatchesCricket,
} = require("../Controllers/thirdPartyController");
const verify = require("../Middleware/verifyJWT");

const router = require("express").Router();

router.get("/demo", verify, getData);
router.get("/getSeriesList",verify, getSeriesList);
router.get("/getAllMatchesList", verify, getAllMatchesList);
router.get("/getMarketList", verify, getMarketList);
router.get("/bookMakerMarket", verify, bookMakerMarket);
router.get("/diamondFancy", verify, diamondFancy);
router.get("/getRunners", verify, getRunners);
router.get("/getScore", verify, getScore);
router.get("/getOdds", verify, getOdds);
router.get("/getFancyResult", getFancyResult);
router.get("/live-tv", verify, getLiveTVURL);
router.get("/cron", saveMatchesCricket);
router.get("/updateMatchRunners", updateMatchRunners);

module.exports = router;
