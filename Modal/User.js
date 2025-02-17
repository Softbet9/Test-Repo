const mongoose = require('mongoose');

const RuleConsentSchema = new mongoose.Schema({
  accepted: {
    type: Boolean,
    default:false,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const UserSchema = new mongoose.Schema(
  {
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    first_name: {type: String, required: true},
    last_name: {type: String},
    fix_limit: {type: Number, required: true},
    exposure: {type: Number, default: 0},
    my_match_share: {type: Number, required: true}, 
    other_match_share: {type: Number, required: true},
    match_commission: {type: Number, required: true},
    session_commission: {type: Number, required: true},
    profile_pic: {type: String, defaut: ''},
    user_type: {type: String, default: false},
    credits: {type: Number, default: false},
    parent_id: {type: String, required: true},
    agent_block: {type: Boolean, default: false},
    bets_block: {type: Boolean, default: false},
    exposure: {type: Number, default: 0},
    profit_limit: {type: Number, default: 0},
    member_max_credit: {type: Number, default: 0},
    ruleConsent:{type:RuleConsentSchema, required:false },
    blocked_sports: [
      {
        sportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
        isBlocked: { type: Boolean, default: false },
      }
    ],
  },
  {timestamps: true},
);

module.exports = mongoose.model('User', UserSchema);
