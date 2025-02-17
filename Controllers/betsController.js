const Transaction = require("../Modal/Bet");
const User = require("../Modal/User");
const Matchlog = require("../Modal/Matchlog");
const FancyTransaction = require("../Modal/FancyTransaction");
const Fancy = require("../Modal/Fancy");
const Match = require("../Modal/Match");

const placeBet = async (req, res) => {
  try {
    let myobj = req.body;
    console.log(myobj);
    let updatedPosition = { ...myobj.position };
    let Home = myobj.bet_on;
    let Away = myobj.opponent_team;
    let match_id = myobj.match_id;
    const homePos = myobj.position[Home];
    const awayPos = myobj.position[Away];
    if(Home!="NO"){
      if (isNaN(homePos) || isNaN(awayPos)) {
        return res.status(400).json({
          status: 0,
          msg: "Rate Changed, Please bet Again.",
        });
      }
    }

    const existingDocument = await Match.findOne({ match_id });
    if (existingDocument) {
      console.log("match already exist");
    } else {
      var newMatch = new Match({
        match_id,
        team1: myobj.team1,
        team2: myobj.team2,
        status: "undeclared",
        match_name: myobj.team1 + " V/s " + myobj.team2,
      });
      const match = await newMatch.save();
      console.log("current saved match ", match);
    }

    if (isNaN(myobj.bet_amount))
      return res.status(400).json({
        status: 0,
        msg: "Bet Amount should be number and is a required filed.",
      });

    let currBetNegative;
    if (myobj.bet_type == "khai") {
      currBetNegative = parseFloat(-0.01 * myobj.bet_rate * myobj.bet_amount);
      updatedPosition[Home] = parseFloat(
        parseFloat(homePos) + currBetNegative
      ).toFixed(2);
      updatedPosition[Away] = parseFloat(
        parseFloat(awayPos) + parseFloat(myobj.bet_amount)
      ).toFixed(2);
    } else if (myobj.bet_type == "lagai") {
      updatedPosition[Home] = parseFloat(
        parseFloat(homePos) +
          parseFloat(0.01 * myobj.bet_rate * myobj.bet_amount)
      ).toFixed(2);
      currBetNegative = parseFloat(-1 * myobj.bet_amount);
      updatedPosition[Away] = parseFloat(parseFloat(awayPos) + currBetNegative);
    } else {
      return res.status(400).json({
        status: 0,
        msg: "Invalid Bet Type - Allowed Bet Types -> lagai , khai",
      });
    }

    if (isNaN(updatedPosition[Home])) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    } else if (isNaN(updatedPosition[Away])) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    }
    let exposure;
    if (updatedPosition[Home] < 0) {
      exposure = updatedPosition[Home] - myobj.position[Home];
    } else {
      exposure = updatedPosition[Away] - myobj.position[Away];
    }
    const user = await User.findById(myobj.user_id);
    console.log({ user_id: myobj.user_id, user });
    console.log({ exposure, credits: user.credits, user_exp: user.exposure });
    const finalExpo = Math.abs(exposure + (user.exposure || 0));
    if (Math.abs(finalExpo) > user.credits)
      return res
        .status(200)
        .json({ status: 0, msg: "Users Exposure can not exceed his Balance." });

    await User.findByIdAndUpdate(myobj.user_id, {
      $inc: { exposure: exposure },
    });
    const newTransaction = new Transaction({
      type: Home!="NO"?"bookmaker":"tie",
      transaction_type: "debit",
      bet_amount: myobj.bet_amount,
      bet_on: myobj.bet_on,
      bet_rate: myobj.bet_rate,
      opponent_team: myobj.opponent_team,
      bet_type: myobj.bet_type,
      position: updatedPosition,
      market_id: myobj.market_id,
      match_id: myobj.match_id,
      user_id: myobj.user_id,
    });
    try {
      const transaction = await newTransaction.save();
      const isMatchlogExist = await Matchlog.findOne({
        match_id: myobj.match_id,
        user_id: myobj.user_id,
      });
      if (isMatchlogExist) {
        await Matchlog.findOneAndUpdate(
          { match_id: myobj.match_id, user_id: myobj.user_id },
          {
            $set: { last_bookmaker_transaction_id: transaction._id.toString() },
          }
        );
      } else {
        const matchLog = new Matchlog({
          user_id: myobj.user_id,
          match_id: myobj.match_id,
          last_bookmaker_transaction_id: newTransaction._id.toString(),
          match_title: myobj.bet_on + " V/s " + myobj.opponent_team,
        });
        try {
          await matchLog.save();
        } catch (er) {
          console.log(err);
          return res(500).json(err);
        }
      }
      const updatedUser = await User.findById(myobj.user_id);
      return res.status(200).json({
        status: 1,
        dataobj: {
          ...transaction._doc,
          user_bal: updatedUser.credits,
          user_exp: updatedUser.exposure,
        },
      });
    } catch (e) {
      console.log("BET PLACED ERR:", e);
      return res.status(500).json(e);
    }
  } catch (err) {
    console.log(err);
    return res.send({ status: 0, msg: err.message });
  }
};

const getAllBetsForTheMatch = async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      {
        $match: { user_id: req.query.user_type, match_id: req.query.match_id },
      },
    ]);
    return res.status(200).json({ status: 1, data });
  } catch (err) {
    console.log(err);
    return res.send({ status: 0, msg: err.message });
  }
};

const placeOddsBet = async (req, res) => {
  try {
    let myobj = req.body;
    let updatedPosition = { ...myobj.position };
    let Home = myobj.bet_on;
    let Away = myobj.opponent_team;
    let match_id = myobj.match_id;
    const homePos = myobj.position[Home];
    const awayPos = myobj.position[Away];
    if (isNaN(homePos) || isNaN(awayPos)) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    }

    const existingDocument = await Match.findOne({ match_id });
    if (existingDocument) {
      console.log("match already exist");
    } else {
      var newMatch = new Match({
        match_id,
        team1: myobj.team1,
        team2: myobj.team2,
        status: "undeclared",
        match_name: myobj.team1 + " V/s " + myobj.team2,
      });
      const match = await newMatch.save();
      console.log("current saved match ", match);
    }

    if (isNaN(myobj.bet_amount))
      return res.status(400).json({
        status: 0,
        msg: "Bet Amount should be number and is a required filed.",
      });

    let currBetNegative;
    if (myobj.bet_type == "khai") {
      currBetNegative = parseFloat(
        -1 * (myobj.bet_rate - 1) * myobj.bet_amount
      );
      updatedPosition[Home] = parseFloat(
        parseFloat(homePos) + currBetNegative
      ).toFixed(2);
      updatedPosition[Away] = parseFloat(
        parseFloat(awayPos) + parseFloat(myobj.bet_amount)
      ).toFixed(2);
    } else if (myobj.bet_type == "lagai") {
      updatedPosition[Home] = parseFloat(
        parseFloat(homePos) +
          parseFloat((myobj.bet_rate - 1) * myobj.bet_amount)
      ).toFixed(2);
      currBetNegative = parseFloat(-1 * myobj.bet_amount);
      updatedPosition[Away] = parseFloat(parseFloat(awayPos) + currBetNegative);
    } else {
      return res.status(400).json({
        status: 0,
        msg: "Invalid Bet Type - Allowed Bet Types -> lagai , khai",
      });
    }

    if (isNaN(updatedPosition[Home])) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    } else if (isNaN(updatedPosition[Away])) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    }

    let exposure;
    if (updatedPosition[Home] < 0) {
      exposure = updatedPosition[Home] - myobj.position[Home];
    } else {
      exposure = updatedPosition[Away] - myobj.position[Away];
    }
    const user = await User.findById(myobj.user_id);
    console.log({ user_id: myobj.user_id, user });
    console.log({
      exposure,
      credits: user.credits,
      user_exp: user.exposure,
      updatedPosition: updatedPosition,
    });
    const finalExpo = Math.abs(exposure + (user.exposure || 0));
    if (Math.abs(finalExpo) > user.credits)
      return res
        .status(200)
        .json({ status: 0, msg: "Users Exposure can not exceed his Balance." });

    await User.findByIdAndUpdate(myobj.user_id, {
      $inc: { exposure: exposure },
    });
    const newTransaction = new Transaction({
      type: "odds",
      transaction_type: "debit",
      bet_amount: myobj.bet_amount,
      bet_on: myobj.bet_on,
      bet_rate: myobj.bet_rate,
      opponent_team: myobj.opponent_team,
      bet_type: myobj.bet_type,
      position: updatedPosition,
      market_id: myobj.market_id,
      match_id: myobj.match_id,
      user_id: myobj.user_id,
    });
    try {
      const transaction = await newTransaction.save();
      const isMatchlogExist = await Matchlog.findOne({
        match_id: myobj.match_id,
        user_id: myobj.user_id,
      });
      if (isMatchlogExist) {
        await Matchlog.findOneAndUpdate(
          { match_id: myobj.match_id, user_id: myobj.user_id },
          {
            $set: { last_odds_transaction_id: transaction._id.toString() },
          }
        );
      } else {
        const matchLog = new Matchlog({
          user_id: myobj.user_id,
          match_id: myobj.match_id,
          last_odds_transaction_id: newTransaction._id.toString(),
          match_title: myobj.bet_on + " V/s " + myobj.opponent_team,
        });
        try {
          await matchLog.save();
        } catch (er) {
          console.log(err);
          return res(500).json(err);
        }
      }
      const updatedUser = await User.findById(myobj.user_id);
      return res.status(200).json({
        status: 1,
        dataobj: {
          ...transaction._doc,
          user_bal: updatedUser.credits,
          user_exp: updatedUser.exposure,
        },
      });
    } catch (e) {
      console.log("BET PLACED ERR:", e);
      return res.status(500).json(e);
    }
  } catch (err) {
    console.log(err);
    return res.send({ status: 0, msg: err.message });
  }

  // try {
  //   let myobj = req.body;

  //   if (isNaN(myobj.bet_amount))
  //     return res.status(400).json({
  //       status: 0,
  //       msg: "Bet Amount should be number and is a required filed.",
  //     });

  //   let exposure;

  //   const user = await User.findById(myobj.user_id);
  //   console.log({ user_id: myobj.user_id, user });
  //   console.log({ exposure, credits: user.credits, user_exp: user.exposure });
  //   const finalExpo = Math.abs(exposure + (user.exposure || 0));
  //   if (Math.abs(finalExpo) > user.credits)
  //     return res
  //       .status(200)
  //       .json({ status: 0, msg: "Users Exposure can not exceed his Balance." });

  //   await User.findByIdAndUpdate(myobj.user_id, {
  //     $inc: { exposure: exposure },
  //   });

  //   try {
  //     const isMatchlogExist = await Matchlog.findOne({
  //       match_id: myobj.match_id,
  //       user_id: myobj.user_id,
  //     });
  //     if (isMatchlogExist) {
  //       await Matchlog.findOneAndUpdate(
  //         { match_id: myobj.match_id, user_id: myobj.user_id },
  //         {
  //           $set: { last_odds_transaction_id: transaction._id.toString() },
  //         }
  //       );
  //     } else {
  //       const matchLog = new Matchlog({
  //         user_id: myobj.user_id,
  //         match_id: myobj.match_id,
  //         last_odds_transaction_id: newTransaction._id.toString(),
  //         match_title: myobj.bet_on + " V/s " + myobj.opponent_team,
  //       });
  //       try {
  //         await matchLog.save();
  //       } catch (er) {
  //         console.log(err);
  //         return res(500).json(err);
  //       }
  //     }
  //     const updatedUser = await User.findById(myobj.user_id);
  //     return res.status(200).json({
  //       status: 1,
  //       dataobj: {
  //         ...transaction._doc,
  //         user_bal: updatedUser.credits,
  //         user_exp: updatedUser.exposure,
  //       },
  //     });
  //   } catch (e) {
  //     console.log("BET PLACED ERR:", e);
  //     return res.status(500).json(e);
  //   }
  // } catch (err) {
  //   console.log(err);
  //   return res.send({ status: 0, msg: err.message });
  // }
};

const placeTossBet = async (req, res) => {
  try {
    let myobj = req.body;
    let updatedPosition = { ...myobj.position };
    let Home = myobj.bet_on;
    let Away = myobj.opponent_team;
    let match_id = myobj.match_id;
    const homePos = myobj.position[Home];
    const awayPos = myobj.position[Away];
    if (isNaN(homePos) || isNaN(awayPos)) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    }

    const existingDocument = await Match.findOne({ match_id });
    if (existingDocument) {
      console.log("match already exist");
    } else {
      var newMatch = new Match({
        match_id,
        team1: myobj.team1,
        team2: myobj.team2,
        status: "undeclared",
        match_name: myobj.team1 + " V/s " + myobj.team2,
      });
      const match = await newMatch.save();
      console.log("current saved match ", match);
    }

    if (isNaN(myobj.bet_amount))
      return res.status(400).json({
        status: 0,
        msg: "Bet Amount should be number and is a required filed.",
      });

    let currBetNegative;
    if (myobj.bet_type == "khai") {
      currBetNegative = parseFloat(
        -1 * (myobj.bet_rate - 1) * myobj.bet_amount
      );
      updatedPosition[Home] = parseFloat(
        parseFloat(homePos) + currBetNegative
      ).toFixed(2);
      updatedPosition[Away] = parseFloat(
        parseFloat(awayPos) + parseFloat(myobj.bet_amount)
      ).toFixed(2);
    } else if (myobj.bet_type == "lagai") {
      updatedPosition[Home] = parseFloat(
        parseFloat(homePos) +
          parseFloat((myobj.bet_rate - 1) * myobj.bet_amount)
      ).toFixed(2);
      currBetNegative = parseFloat(-1 * myobj.bet_amount);
      updatedPosition[Away] = parseFloat(parseFloat(awayPos) + currBetNegative);
    } else {
      return res.status(400).json({
        status: 0,
        msg: "Invalid Bet Type - Allowed Bet Types -> lagai , khai",
      });
    }

    if (isNaN(updatedPosition[Home])) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    } else if (isNaN(updatedPosition[Away])) {
      return res.status(400).json({
        status: 0,
        msg: "Rate Changed, Please bet Again.",
      });
    }

    let exposure;
    if (updatedPosition[Home] < 0) {
      exposure = updatedPosition[Home] - myobj.position[Home];
    } else {
      exposure = updatedPosition[Away] - myobj.position[Away];
    }
    const user = await User.findById(myobj.user_id);
    console.log({ user_id: myobj.user_id, user });
    console.log({
      exposure,
      credits: user.credits,
      user_exp: user.exposure,
      updatedPosition: updatedPosition,
    });
    const finalExpo = Math.abs(exposure + (user.exposure || 0));
    if (Math.abs(finalExpo) > user.credits)
      return res
        .status(200)
        .json({ status: 0, msg: "Users Exposure can not exceed his Balance." });

    await User.findByIdAndUpdate(myobj.user_id, {
      $inc: { exposure: exposure },
    });
    const newTransaction = new Transaction({
      type: "toss",
      transaction_type: "debit",
      bet_amount: myobj.bet_amount,
      bet_on: myobj.bet_on,
      bet_rate: myobj.bet_rate,
      opponent_team: myobj.opponent_team,
      bet_type: myobj.bet_type,
      position: updatedPosition,
      market_id: myobj.market_id,
      match_id: myobj.match_id,
      user_id: myobj.user_id,
    });
    try {
      const transaction = await newTransaction.save();
      const isMatchlogExist = await Matchlog.findOne({
        match_id: myobj.match_id,
        user_id: myobj.user_id,
      });
      if (isMatchlogExist) {
        await Matchlog.findOneAndUpdate(
          { match_id: myobj.match_id, user_id: myobj.user_id },
          {
            $set: { last_odds_transaction_id: transaction._id.toString() },
          }
        );
      } else {
        const matchLog = new Matchlog({
          user_id: myobj.user_id,
          match_id: myobj.match_id,
          last_odds_transaction_id: newTransaction._id.toString(),
          match_title: myobj.bet_on + " V/s " + myobj.opponent_team,
        });
        try {
          await matchLog.save();
        } catch (er) {
          console.log(err);
          return res(500).json(err);
        }
      }
      const updatedUser = await User.findById(myobj.user_id);
      return res.status(200).json({
        status: 1,
        dataobj: {
          ...transaction._doc,
          user_bal: updatedUser.credits,
          user_exp: updatedUser.exposure,
        },
      });
    } catch (e) {
      console.log("BET PLACED ERR:", e);
      return res.status(500).json(e);
    }
  } catch (err) {
    console.log(err);
    return res.send({ status: 0, msg: err.message });
  }
};

const placeFancyBet = async (req, res) => {
  console.log("THIS HIT");
  try {
    let myobj = req.body;
    let selection_id = myobj.selection_id;
    let match_id = myobj.match_id;

    const existingDocument = await Fancy.findOne({ match_id, selection_id });
    console.log(JSON.stringify(existingDocument));
    if (!existingDocument) {
      var newFancy = new Fancy({
        match_id,
        selection_id,
        runnerName: myobj.runnerName,
        team1: myobj.team1,
        team2: myobj.team2,
        layPrice: myobj.fancy_details.layPrice1,
        backPrice: myobj.fancy_details.backPrice1,
        match_result: "undeclared",
      });
      const fancy = await newFancy.save();
      console.log("fancy", fancy);
    }

    if (isNaN(myobj.bet_amount))
      return res.status(400).json({
        status: 0,
        msg: "Bet Amount should be number and is a required filed.",
      });
    let exposure = -1 * myobj.bet_amount;
    const user = await User.findById(myobj.user_id);
    console.log({ user_id: myobj.user_id, user });
    console.log({ exposure, credits: user.credits, user_exp: user.exposure });
    const finalExpo = Math.abs(exposure + (user.exposure || 0));
    if (Math.abs(finalExpo) > user.credits)
      return res
        .status(200)
        .json({ status: 0, msg: "Users Exposure can not exceed his Balance." });

    await User.findByIdAndUpdate(myobj.user_id, {
      $inc: { exposure: exposure },
    });
    // if (myobj.bet_type == "No") {
    //   updatedPosition["No"] = parseFloat(
    //     noPos + (myobj.bet_rate / 100) * myobj.bet_amount
    //   ).toFixed(2);
    //   updatedPosition["Yes"] = parseFloat(yesPos + myobj.bet_amount).toFixed(2);
    // } else if (myobj.bet_type == "Yes") {
    //   updatedPosition["Yes"] = parseFloat(
    //     noPos + (myobj.bet_rate / 100) * myobj.bet_amount
    //   ).toFixed(2);
    //   updatedPosition["No"] = parseFloat(yesPos * myobj.bet_amount).toFixed(2);
    // } else {
    //   return res.status(400).json({
    //     status: 0,
    //     msg: "Invalid Bet Type - Allowed Bet Types -> No , Yes",
    //   });
    // }
    const newTransaction = new FancyTransaction({
      bet_amount: myobj.bet_amount,
      bet_rate: myobj.bet_rate,
      bet_type: myobj.bet_type,
      team1: myobj.team1,
      team2: myobj.team2,
      market_id: myobj.market_id,
      match_id: myobj.match_id,
      user_id: myobj.user_id,
      selection_id: myobj.selection_id,
      fancy_Detail: myobj.fancy_details,
    });
    try {
      const updatedUser = await User.findById(myobj.user_id);
      const transaction = await newTransaction.save();
      return res.status(200).json({
        status: 1,
        dataobj: {
          ...transaction._doc,
          user_bal: updatedUser.credits,
          user_exp: updatedUser.exposure,
        },
      });
    } catch (err) {
      return res.status(500).json(err);
    }
  } catch (err) {
    console.log(err);
    return res.send({ status: 0, msg: err.message });
  }
};

const getSessionBets = async (req, res) => {
  try {
    const myobj = req.query;
    const fancyBets = await FancyTransaction.find({
      match_id: myobj.match_id,
      user_id: myobj.user_id,
    });
    return res.status(200).json({ status: 1, dataobj: fancyBets });
  } catch (err) {
    console.log(err);
  }
};

const getStatementOfAUser = async (req, res) => {
  try {
    const data = await Transaction.find({ user_id: req.query.user_id }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ status: 1, data });
  } catch (err) {
    console.log(err);
    return res.send({ status: 0, msg: err.message });
  }
};

const getLastPositionForTheMatch = async (req, res) => {
  try {
    // const data = await Transaction.aggregate([
    //   {
    //     $match: {
    //       match_id: req.query.match_id,
    //       user_id: req.query.user_id,
    //       type: { $in: ["fancy", "odds", "bookmaker"] },
    //     },
    //   },
    //   {
    //     $sort: {
    //       type: 1,
    //       createdAt: -1,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$type",
    //       latestTransaction: { $first: "$$ROOT" },
    //     },
    //   },
    //   {
    //     $replaceRoot: { newRoot: "$latestTransaction" },
    //   },
    // ]);

    let data = {};
    const matchLog = await Matchlog.findOne({
      match_id: req.query.match_id,
      user_id: req.query.user_id,
    });
    if (matchLog?.last_bookmaker_transaction_id) {
      var lastBookmaker = await Transaction.findById(
        matchLog.last_bookmaker_transaction_id
      );
      data["bookmaker"] = lastBookmaker?.position;
    }
    if (matchLog?.last_odds_transaction_id) {
      var lastOdds = await Transaction.findById(
        matchLog.last_odds_transaction_id
      );
      data["odds"] = lastOdds?.position;
    }
    if (matchLog?.last_fancy_transaction_id) {
      var lastFancy = await Transaction.findById(
        matchLog.last_fancy_transaction_id
      );
      data["fancy"] = lastFancy?.position;
    }

    return res.status(200).json({ status: 1, data });
  } catch (err) {
    console.log(err);
    return res.send({ status: 0, msg: err.message });
  }
};

const getMatchesByUserBet = async (req, res) => {
  try {
    const { adminId, matchType } = req.body; // Get the adminId and matchType from request
    console.log("Admin ID:", adminId, "Match Type:", matchType);

    // Recursively get all child user IDs
    const userIds = await getAllChildUserIdsRecursively(adminId);
    console.log("All User IDs:", userIds);

    // Fetch all transactions by these users
    const transactions = await Transaction.find({ user_id: { $in: userIds } });
    console.log("Transactions:", transactions);

    // Group transactions by match_id and count total bets
    const matchUserMap = {};
    transactions.forEach((txn) => {
      const { match_id } = txn;

      if (!matchUserMap[match_id]) {
        matchUserMap[match_id] = 0; // Initialize count to 0
      }
      matchUserMap[match_id]++; // Increment for each bet
    });

    // Prepare match data
    const matchData = Object.entries(matchUserMap).map(
      ([match_id, betCount]) => ({
        match_id,
        user_count: betCount, // Total bets for each match
      })
    );

    // Get all match IDs
    const matchIds = matchData.map((m) => m.match_id);

    // Fetch match details for the collected match IDs

    const cond =
      matchType == "all"
        ? {
            match_id: { $in: matchIds },
            status: "undeclared",
          }
        : {
            match_id: { $in: matchIds },
            type: matchType,
            status: "undeclared",
          };
    const matches = await Match.find(cond);
    console.log("Matches:", matches);

    // Attach user_count to each match
    const matchesWithCounts = matches.map((match) => ({
      ...match._doc, // Spread original match data
      user_count:
        matchData.find((m) => m.match_id === match.match_id)?.user_count || 0,
    }));

    return res.status(200).json({ status: 1, matches: matchesWithCounts });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ status: 0, error: "Internal Server Error" });
  }
};

const getAllChildUserIdsRecursively = async (userId) => {
  const childUsers = await User.find({ parent_id: userId }); // Get direct children
  let allUserIds = childUsers.map((user) => user._id.toString()); // Collect their IDs

  // Recursively fetch children of each child user
  for (const child of childUsers) {
    const subChildIds = await getAllChildUserIdsRecursively(child._id);
    allUserIds = allUserIds.concat(subChildIds); // Collect all descendant IDs
  }

  return allUserIds;
};

module.exports = {
  placeBet,
  getAllBetsForTheMatch,
  placeOddsBet,
  getStatementOfAUser,
  placeFancyBet,
  getLastPositionForTheMatch,
  getSessionBets,
  getMatchesByUserBet,
  placeTossBet
};
