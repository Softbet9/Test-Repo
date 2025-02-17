
const {
  LoginController,
  changePasswordController,
  PanelLoginController,
  companyLogin,
  rulesController,
  userRoutesController,
} = require("../Controllers/authController");
const verify = require("../Middleware/verifyJWT");

const router = require("express").Router();

//LOGIN
router.post("/login", LoginController);
router.post("/login-panel", PanelLoginController);
router.post("/login-company", companyLogin);
router.put("/change-password/:user_id/:old_pass",verify, changePasswordController);
router.put("/rules/:user_id",verify, rulesController);
router.get("/page-access",verify, userRoutesController);

module.exports = router;
