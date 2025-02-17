const mongoose = require("mongoose");

const collectionReport = new mongoose.Schema(
  {
    is_settled: { type: Boolean },
    user_id: { type: String },
    collect_from_user_id: { type: String },
    collect_from_username: { type: String },
    amount: { type: Number },
    share_of: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CollectionReport", collectionReport);
