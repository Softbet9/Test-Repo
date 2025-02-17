const mongoose = require('mongoose');

const WinningLimitSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sport: {type: String, required: true}, // e.g., "cricket", "soccer", "tennis"
    sport_limit: {type: Number, default: 0},
    fancy_winning_limit: {type: Number, default: 0},
    book_market_winning_limit: {type: Number, default: 0},
  },
  {timestamps: true},
);

module.exports = mongoose.model('WinningLimit', WinningLimitSchema);
