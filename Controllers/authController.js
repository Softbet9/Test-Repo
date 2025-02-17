const User = require("../Modal/User");
const jwt = require("jsonwebtoken");
const UserRoutes = require("../Modal/User-routes");
const { ObjectId } = require('mongoose').Types;
const LoginController = async (req, res) => {
  try {
    // Normalize username to lowercase for case-insensitive comparison
    const { usernameOrPhone, password } = req.body;
    let user;

    // Check if input is a phone number or username
    // if (usernameOrPhone.match(/^\d{10}$/)) { // Assuming phone numbers are 10 digits
    //   user = await User.findOne({ phone: usernameOrPhone });
    // } else {
      user = await User.findOne({ username: usernameOrPhone.toLowerCase() });
    // }
    console.log(user);
    // If user not found, return an error
    if (!user) {
      return res.status(401).json({ msg: "Wrong password or username!" });
    }

    // Check if password matches
    const { password: storedPassword, ...info } = user._doc;
    if (storedPassword !== password) {
      return res.status(401).json({ msg: "Wrong password or username!" });
    }

    // Generate access token
    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    // Respond with user info and access token
    return res.status(200).json({ ...info, accessToken });

  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const PanelLoginController = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user)
      return res.status(401).json({ msg: "Wrong password or username!" });
    console.log(user);
    if (user.user_type === 'user') {
        return res.status(401).json({ msg: "Access denied for user type 'user'." });
    }

    const { password, ...info } = user._doc;
    if (password !== req.body.password)
      return res.status(401).json({ msg: "Wrong password or username!" });

    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );
    return res.status(200).json({ ...info, accessToken });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};
const companyLogin = async(req,res) =>{
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user)
      return res.status(401).json({ msg: "Wrong password or username!" });

    if (user.user_type === 'company') {
      const { password, ...info } = user._doc;
      if (password !== req.body.password)
        return res.status(401).json({ msg: "Wrong password or username!" });
  
      const accessToken = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.SECRET_KEY,
        { expiresIn: "1d" }
      );
      return res.status(200).json({ ...info, accessToken });
    }
    return res.status(401).json({ msg: "Access denied for user type 'user'." });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
}
const changePasswordController = async (req, res) => {
  let myobj = req.body;
  console.log(myobj);
  try {
    const checkPass = await User.findById(req.params.user_id)
    if (!checkPass ) {
      return res.status(404).json({ msg: "User not found" });
      }
      if (checkPass.password !== req.params.old_pass) {
        return res.status(200).json({ msg: "Old password is incorrect" });
        }
    const updateUser = await User.findByIdAndUpdate(
      req.params.user_id,
      {
        $set: myobj,
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ status: 1, msg: "Password updated Successfully." });
  } catch (err) {
    return res.status(500).json(err);
  }
};
const clientChangePasswordController = async (req, res) => {
  let myobj = req.body;
  console.log(myobj);
  try {
    const checkPass = await User.findById(req.params.user_id)
    if (!checkPass ) {
      return res.status(404).json({ msg: "User not found" });
      }
    const updateUser = await User.findByIdAndUpdate(
      req.params.user_id,
      {
        $set: myobj,
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ status: 1, msg: "Password updated Successfully." });
  } catch (err) {
    return res.status(500).json(err);
  }
};
const clientListController = async (req, res) => {
  try {
    const users = await User.find({ parent_id: req.params.user_id },{ username: 1, _id: 0 });

    // Check if the users is empty or not found
    if (!users || users.length === 0) {
      return res.status(404).json({ status: 0, msg: "No users found for the given parent_id" });
    }
const list = users.map(user=>user.username)
    // Return the fetched users list
    return res.status(200).json({ status: 1, list });
  } catch (err) {
    return res.status(500).json(err);
  }
};

const rulesController = async(req,res)=>{
  let myobj = req.body;
  console.log(myobj);
  try {
    if(!req.body.ruleConsent.accepted){
      const rules = await User.findById(req.params.user_id);
      return res
      .status(200)
      .json({ status: 1,ruleAccepted: rules.ruleConsent.accepted});
    }
    
    if(req.body.ruleConsent.accepted){
      const updaterules = await User.findByIdAndUpdate(
        req.params.user_id,
        {
          $set: myobj,
        }
      );
      return res
        .status(200)
        .json({ status: 1,ruleAccepted: true});
    }
  } catch (err) {
    return res.status(500).json(err);
  }
}
const userRoutesController = async(req,res)=>{
  
  try {
    const page = await UserRoutes.find({});
      return res
        .status(200)
        .json({ status: 1,data:page[0].routing_path});
  } catch (err) {
    return res.status(500).json(err);
  }
}
module.exports = { LoginController, changePasswordController,PanelLoginController,companyLogin,rulesController,userRoutesController,clientChangePasswordController,clientListController};
