const { changePasswordController, clientChangePasswordController, clientListController } = require("../Controllers/authController");
const {
  addUser,
  getUsers,
  getUser,
  updateUser,
  updateWinningLimit,
  getUserLedger,
  getUserStatement,
  getMyClient,
  getBlockedClient,
  getCollectionReport,
  settleCollectionReport,
  getCommissionAndLimit,
  depositToUser,
  withdrawFromUser,
  getBalanceAndExposure,
  getProfitAndLossOfCompletedMatchs,
  getLiveMatchReport,
  getMyMatchedMarket,
  getFancyBetsOfMatchOfUser,
  getMatchBetsOfMatchOfUser,
  getUsersWithProfitLoss
} = require("../Controllers/userManagement");
const verify = require("../Middleware/verifyJWT");

const router = require("express").Router();

//LOGIN
router.post("/add-user", verify, addUser);
router.get("/get-users",verify, getUsers);
router.get("/get-users-profit-loss",verify, getUsersWithProfitLoss);
router.get("/get-my-bets",verify, getMyMatchedMarket);
router.get("/get-user",verify, getUser);
router.put("/update-user", verify, updateUser);
router.put("/update-winning-limit", verify, updateWinningLimit);
router.put("/change-password/:user_id", verify, clientChangePasswordController);
router.get("/client-list/:user_id", verify, clientListController);
router.get("/getUserLedger", verify, getUserLedger);
router.get("/getUserStatement", verify,  getUserStatement);
router.get("/getMyClient", verify, getMyClient);
router.get("/getBlockedClient", verify, getBlockedClient);
router.get("/getCollectionReport", verify, getCollectionReport);
router.post("/settleCollectionReport", verify, settleCollectionReport);
router.get("/getCommissionAndLimit", verify, getCommissionAndLimit);
router.get(
  "/getProfitAndLossOfCompletedMatchs", verify,
  getProfitAndLossOfCompletedMatchs
);
router.post("/deposit", verify, depositToUser);
router.post("/withdraw", verify, withdrawFromUser);
router.get("/userAccDetails", verify, getBalanceAndExposure);
router.get("/getFancyBetsOfMatchOfUser", verify, getFancyBetsOfMatchOfUser);
router.get("/getMatchBetsOfMatchOfUser", verify, getMatchBetsOfMatchOfUser);
module.exports = router;
