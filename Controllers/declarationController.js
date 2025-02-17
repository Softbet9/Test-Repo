const User = require("../Modal/User");
const MatchLog = require("../Modal/Matchlog");
const Bet = require("../Modal/Bet");
const FancyTransaction = require("../Modal/FancyTransaction");
const Fancy = require("../Modal/Fancy");
const Match = require("../Modal/Match");

const CollectionReport = require("../Modal/CollectionReport");
const CreditTransactions = require("../Modal/CreditTransactions");
const ProfitLoss = require("../Modal/ProfitLoss");

const handleCollectionReport = async (user_id, amount, match_id) => {
  try {
    const currUser = await User.findById(user_id);
    if (currUser.parent_id && currUser.parent_id != "0") {
      const parent = await User.findById(currUser.parent_id);
      const collectBalance = (
        0.01 *
        currUser.other_match_share *
        amount
      ).toFixed(2);
      const myShare = (0.01 * currUser.my_match_share * amount).toFixed(2);
      console.log({
        amount,
        share: currUser.other_match_share,
        collect: collectBalance,
      });
      try {
        await CollectionReport.findOneAndUpdate(
          {
            collect_from_user_id: currUser.parent_id,
            user_id: user_id,
            collect_from_username: parent.username,
          },
          { $inc: { amount: myShare } },
          { upsert: true }
        );
        await CollectionReport.findOneAndUpdate(
          {
            collect_from_user_id: user_id,
            user_id: currUser.parent_id,
            collect_from_username: currUser.username,
          },
          { $inc: { amount: collectBalance } },
          { upsert: true }
        );
        let setQuery = {
          $inc: {},
        };
        setQuery.$inc["profit_loss_ledger." + match_id] =
          parseFloat(collectBalance);

        await ProfitLoss.findOneAndUpdate(
          {
            user_id: currUser.parent_id,
          },
          setQuery,
          { upsert: true }
        );
      } catch (er) {
        console.log(er);
      }
      console.log("My Match Share", currUser.my_match_share);

      handleCollectionReport(currUser.parent_id.toString(), amount, match_id);
    } else {
      console.log("My Match Share1", currUser.my_match_share);
    }
  } catch (err) {
    console.log("error123", err);
  }
};

var declareMatch = async (req, res) => {
  try {
    const myobj = req.body;

    const undeclaredFancyRecord = await Fancy.findOne({
      match_id: myobj.match_id,
      fancy_result: "undeclared",
    });
    console.log({ undeclaredFancyRecord });
    if (undeclaredFancyRecord) {
      return res.status(409).json({
        status: 0,
        msg: "Please declare all Fancy",
      });
    }
    // return res.status(200).json("TEST");
    const MatchRecord = await Match.findOneAndUpdate(
      { match_id: myobj.match_id },
      {
        $set: {
          winner: myobj.winner,
          loser: myobj.loser,
          status: "declared",
        },
      },
      { returnDocument: "after" }
    );

    let matchLogs = await MatchLog.find({ match_id: myobj.match_id });
    let addToUser = [];
    const result = [];
    for (let i = 0; i < matchLogs.length; i++) {
      let reduceExposure = 0;
      const bookMakerBet = await Bet.findById(
        matchLogs[i].last_bookmaker_transaction_id
      );
      const oddsBet = await Bet.findById(matchLogs[i].last_odds_transaction_id);
      console.log({ bookMakerBet, oddsBet });
      // const oddsBet = await Bet.findById(matchLogs[i].last_fancy_transaction_id)
      const wonInBookMaker = bookMakerBet?.position[myobj.winner] || 0;
      const wonInOdds = oddsBet?.position[myobj.winner] || 0;
      const totalWinnings = parseFloat(wonInBookMaker) + parseFloat(wonInOdds);

      if (bookMakerBet?.position[myobj.winner] < 0) {
        console.log("Winner BookMaker");
        reduceExposure += parseFloat(bookMakerBet?.position[myobj.winner]);
      } else if (bookMakerBet?.position[myobj.loser] < 0) {
        console.log("Loser BookMaker");
        reduceExposure += parseFloat(bookMakerBet?.position[myobj.loser]);
      } else {
        console.log("NONe");
        console.log({ winner: myobj.winner, losser: myobj.loser });
      }

      console.log({ wonInBookMaker, wonInOdds, totalWinnings });

      const losingInBookMaker =
        bookMakerBet?.position[myobj.loser] < 0
          ? bookMakerBet?.position[myobj.loser]
          : 0;
      const losingInOdds =
        oddsBet?.position[myobj.loser] < 0 ? oddsBet?.position[myobj.loser] : 0;
      const totalLoss = losingInBookMaker + losingInOdds;

      if (oddsBet?.position[myobj.winner] < 0) {
        reduceExposure += parseFloat(oddsBet?.position[myobj.winner]);
      } else if (oddsBet?.position[myobj.loser] < 0) {
        reduceExposure += parseFloat(oddsBet?.position[myobj.loser]);
      }
      console.log({ reduceExposure });

      handleCollectionReport(
        matchLogs[i].user_id,
        totalWinnings,
        myobj.match_id
      );
      const user = await User.findByIdAndUpdate(
        matchLogs[i].user_id,
        {
          $inc: {
            credits: totalWinnings,
            exposure: Math.abs(reduceExposure),
          },
        },
        { returnDocument: "after" }
      );
      const credisTransction = new CreditTransactions({
        user_id: matchLogs[i].user_id,
        credit: totalWinnings > 0 ? totalWinnings : 0,
        debit: totalWinnings <= 0 ? totalWinnings : 0,
        description:
          (totalWinnings > 0 ? "Profit in " : "Loss in ") +
          matchLogs[i].match_title,
        balance: user.credits,
        date: new Date().toString(),
      });

      await credisTransction.save();

      //GEt Fancy Amount
      let WonInFancy = 0;
      const fancyTransactions = (
        await FancyTransaction.find({
          match_id: myobj.match_id,
          user_id: matchLogs[i].user_id,
        })
      ).forEach((item) => {
        WonInFancy += item?.amount_added;
      });
      console.log("THIS WAS PROBLEMATIC", { totalWinnings, WonInFancy });
      const newMatchLogs = await MatchLog.findOneAndUpdate(
        { match_id: myobj.match_id, user_id: matchLogs[i].user_id },
        {
          $set: {
            match_result: "declared",
            match_winner: myobj.winner,
            match_loser: myobj.loser,
            book_maker_winnings: parseFloat(wonInBookMaker || 0),
            odds_winnings: parseFloat(wonInOdds || 0),
            fancy_winnings: parseFloat(WonInFancy || 0),
            amount_added:
              parseFloat(totalWinnings || 0) + parseFloat(WonInFancy || 0),
            current_available_balance: user.credits,
          },
        },
        { returnDocument: "after" }
      );

      console.log({ newMatchLogs });

      addToUser.push({ totalLoss, totalWinnings });
      // addToUser.push(bookMakerBet.position[myobj.winner]);
      // const user = await User.findById(matchLogs[i].user_id);
      result.push(user);
    }

    res.status(200).json({
      status: 1,
      dataobj: matchLogs,
      addToUser,
      result,
    });
  } catch (err) {
    console.log(err);
  }
};

const undeclareMatch = async (req, res) => {
  try {
    const myobj = req.body;

    // Update the match record to revert to the previous state
    const MatchRecord = await Match.findOneAndUpdate(
      { match_id: myobj.match_id, status: "declared" },
      {
        $set: {
          winner: null,
          loser: null,
          status: "undeclared", // Change status to "undeclared"
        },
      },
      { returnDocument: "after" }
    );

    // Check if there was no match record with declared status
    if (!MatchRecord) {
      return res.status(404).json({
        status: 0,
        msg: "No declared match found with the provided match ID.",
      });
    }

    // Retrieve match logs for the match
    const matchLogs = await MatchLog.find({ match_id: myobj.match_id });

    // Initialize an array to store information about changes made to user accounts
    const result = [];

    // Iterate over match logs to revert user account changes
    for (let i = 0; i < matchLogs.length; i++) {
      // Revert match log changes
      await MatchLog.findOneAndUpdate(
        { match_id: myobj.match_id, user_id: matchLogs[i].user_id },
        {
          $set: {
            match_result: "undeclared", // Change match result to "undeclared"
            match_winner: null,
            match_loser: null,
            book_maker_winnings: 0,
            odds_winnings: 0,
            fancy_winnings: 0,
            amount_added: 0,
            current_available_balance: matchLogs[i].initial_available_balance, // Assuming you have a field to store initial balance
          },
        }
      );

      // Revert user account changes
      const user = await User.findByIdAndUpdate(
        matchLogs[i].user_id,
        {
          $inc: {
            credits: -matchLogs[i].totalWinnings, // Deduct total winnings
            exposure: -matchLogs[i].reduceExposure, // Deduct exposure adjustment
          },
        },
        { returnDocument: "after" }
      );

      // Delete corresponding credit transaction
      await CreditTransactions.deleteOne({
        _id: matchLogs[i].credit_transaction_id,
      });

      result.push(user);
    }

    res.status(200).json({
      status: 1,
      msg: "Match declaration revoked successfully.",
      result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 0,
      msg: "Internal server error.",
    });
  }
};

const declareAbandonedOrTie = async (req, res) => {
  try {
    const myobj = req.body;

    const undeclaredFancyRecord = await Fancy.findOne({
      match_id: myobj.match_id,
      fancy_result: "undeclared",
    });
    console.log({ undeclaredFancyRecord });
    if (undeclaredFancyRecord) {
      return res.status(409).json({
        status: 0,
        msg: "Please declare all Fancy",
      });
    }
    // return res.status(200).json("TEST");
    const MatchRecord = await Match.findOneAndUpdate(
      { match_id: myobj.match_id },
      {
        $set: {
          winner: "Tied",
          loser: "Tied",
          status: "declared",
        },
      },
      { returnDocument: "after" }
    );

    let matchLogs = await MatchLog.find({ match_id: myobj.match_id });
    let addToUser = [];
    const result = [];
    for (let i = 0; i < matchLogs.length; i++) {
      let reduceExposure = 0;
      const bookMakerBet = await Bet.findById(
        matchLogs[i].last_bookmaker_transaction_id
      );
      const oddsBet = await Bet.findById(matchLogs[i].last_odds_transaction_id);
      console.log({ bookMakerBet, oddsBet });
      // const oddsBet = await Bet.findById(matchLogs[i].last_fancy_transaction_id)
      const wonInBookMaker = bookMakerBet?.position[myobj.winner] || 0;
      const wonInOdds = oddsBet?.position[myobj.winner] || 0;
      const totalWinnings = parseFloat(wonInBookMaker) + parseFloat(wonInOdds);
      if (bookMakerBet?.position) {
        const { team1, team2 } = bookMakerBet.position;
        if (bookMakerBet?.position[team1] < 0) {
          console.log("Winner BookMaker");
          reduceExposure += parseFloat(bookMakerBet?.position[team1]);
        } else if (bookMakerBet?.position[team2] < 0) {
          console.log("Loser BookMaker");
          reduceExposure += parseFloat(bookMakerBet?.position[team2]);
        } else {
          console.log("NONe");
        }
      }

      // console.log({ wonInBookMaker, wonInOdds, totalWinnings });

      // const losingInBookMaker =
      //   bookMakerBet?.position[myobj.loser] < 0
      //     ? bookMakerBet?.position[myobj.loser]
      //     : 0;
      // const losingInOdds =
      //   oddsBet?.position[myobj.loser] < 0 ? oddsBet?.position[myobj.loser] : 0;
      // const totalLoss = losingInBookMaker + losingInOdds;
      if (oddsBet?.position) {
        const { oddsTeam1, oddsTeam2 } = oddsBet.position;
        if (oddsBet?.position[oddsTeam1] < 0) {
          reduceExposure += parseFloat(oddsBet?.position[oddsTeam1]);
        } else if (oddsBet?.position[oddsTeam2] < 0) {
          reduceExposure += parseFloat(oddsBet?.position[oddsTeam2]);
        }
        console.log({ reduceExposure });
      }

      // handleCollectionReport(matchLogs[i].user_id, totalWinnings);
      const user = await User.findByIdAndUpdate(
        matchLogs[i].user_id,
        {
          $inc: {
            exposure: Math.abs(reduceExposure),
          },
        },
        { returnDocument: "after" }
      );

      //GEt Fancy Amount
      let WonInFancy = 0;
      const fancyTransactions = (
        await FancyTransaction.find({
          match_id: myobj.match_id,
          user_id: matchLogs[i].user_id,
        })
      ).forEach((item) => {
        WonInFancy += item?.amount_added;
      });
      console.log("THIS WAS PROBLEMATIC", { totalWinnings, WonInFancy });
      const newMatchLogs = await MatchLog.findOneAndUpdate(
        { match_id: myobj.match_id, user_id: matchLogs[i].user_id },
        {
          $set: {
            match_result: "declared",
            match_winner: "Tied",
            match_loser: "Tied",
            book_maker_winnings: 0,
            odds_winnings: 0,
            fancy_winnings: parseFloat(WonInFancy || 0),
            amount_added: 0 + parseFloat(WonInFancy || 0),
            current_available_balance: user.credits,
          },
        },
        { returnDocument: "after" }
      );

      // addToUser.push(bookMakerBet.position[myobj.winner]);
      // const user = await User.findById(matchLogs[i].user_id);
      result.push(user);
    }

    res.status(200).json({
      status: 1,
      dataobj: matchLogs,
      addToUser,
      result,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 0, msg: err.message });
  }
};

var declareFancy = async (req, res) => {
  try {
    const myobj = req.body;
    // Get Fancy From and Fancy Collection and Update to Given Result
    const currFancy = await Fancy.findOneAndUpdate(
      {
        match_id: myobj.match_id,
        selection_id: myobj.selection_id,
      },
      { $set: { settled_at: myobj.settled_at, fancy_result: "declared" } }
    );

    // Get All The Fancy Transactions
    const fancyTrans = await FancyTransaction.find({
      match_id: myobj.match_id,
      selection_id: myobj.selection_id,
      // settled_at: myobj.settled_at,
    });

    for (let i = 0; i < fancyTrans.length; i++) {
      const currentFancy = fancyTrans[i];
      const exposure = currentFancy.bet_amount;
      let totalWinnings;
      let fancy_result = "";
      if (
        currentFancy.bet_type == "Yes" &&
        currentFancy?.fancy_Detail?.backPrice1 <= myobj.settled_at
      ) {
        fancy_result = "Won";
        totalWinnings =
          // parseFloat(exposure) +
          parseFloat((0.01 * currentFancy.bet_rate * exposure).toFixed(2));
      } else if (
        currentFancy.bet_type == "No" &&
        currentFancy?.fancy_Detail?.layPrice1 >= myobj.settled_at
      ) {
        fancy_result = "Won";
        totalWinnings =
          // parseFloat(exposure) +
          parseFloat((0.01 * currentFancy.bet_rate * exposure).toFixed(2));
      } else {
        fancy_result = "Lose";
        totalWinnings = -1 * parseFloat(exposure);
      }

      console.log({ totalWinnings, exposure });
      //Updateting the User
      handleCollectionReport(
        currentFancy.user_id,
        totalWinnings,
        myobj.match_id
      );
      const user = await User.findByIdAndUpdate(
        currentFancy.user_id,
        {
          $inc: {
            credits: totalWinnings,
            exposure: exposure,
          },
        },
        { returnDocument: "after" }
      );
      // Added to Credits
      const credisTransction = new CreditTransactions({
        user_id: currentFancy.user_id,
        credit: totalWinnings > 0 ? totalWinnings : 0,
        debit: totalWinnings <= 0 ? totalWinnings : 0,
        description:
          (totalWinnings > 0 ? "Profit in " : "Loss in ") +
          currentFancy?.fancy_Detail?.runnerName,
        balance: user.credits,
        date: new Date().toString(),
      });

      await credisTransction.save();
      //updating the Fancy Transaction itself
      const fancyUpdate = await FancyTransaction.findByIdAndUpdate(
        currentFancy._id,
        {
          $set: {
            result: "declared",
            fancy_result: fancy_result,
            amount_added: totalWinnings,
            current_available_balance: user.credits,
          },
        }
      );

      console.log({ fancyUpdate });
    }
    return res.status(200).json({ status: 1, msg: "Fancy Declared" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 0, msg: err.message });
  }
};

const undeclareFancy = async (req, res) => {
  try {
    const myobj = req.body;
    const givenFancy = await Fancy.findOneAndUpdate(
      { match_id: myobj.match_id, selection_id: myobj.selection_id },
      {
        $set: {
          fancy_result: "undeclared",
          settled_at: null,
        },
      },
      { new: true, upsert: true }
    );

    const allFancyTransactions = await FancyTransaction.find({
      match_id: myobj.match_id,
      selection_id: myobj.selection_id,
    });

    for (let i = 0; i < allFancyTransactions.length; i++) {
      const currFancy = allFancyTransactions[i];
      const updatedFancyTrans = await FancyTransaction.findByIdAndUpdate(
        {
          user_id: currFancy.user_id,
          match_id: myobj.match_id,
          selection_id: myobj.selection_id,
        },
        {
          $set: {
            settled_at: "",
            fancy_result: "undeclared",
          },
        },{ new: true, upsert: true }
      );
      let totalWinnings;
      if (currFancy.fancy_result == "won") {
        totalWinnings = 0.01 * currFancy.bet_rate * currFancy.bet_amount;
      } else if (currFancy.fancy_result == "lose") {
        totalWinnings = -1 * currFancy.bet_amount;
      } else {
        totalWinnings = 0;
      }
      const updateUserToResetExposure = await User.findByIdAndUpdate(
        currFancy.user_id,
        {
          $inc: {
            totalWinnings: -1 * totalWinnings,
            exposure: -1 * currFancy.bet_amount,
          },
        }
      );

      await CreditTransactions.findByIdAndDelete(currFancy.credit_trans_id);
    }

    return res
      .status(200)
      .json({ status: 1, msg: "Given Fancy is undeclared." });
  } catch (err) {
    return res.status(500).json({ status: 0, msg: "Internal Server Error" });
  }
};

const declareAbandonedFancy = async (req, res) => {
  try {
    const myobj = req.body;
    const currFancy = await Fancy.findOneAndUpdate(
      {
        match_id: myobj.match_id,
        selection_id: myobj.selection_id,
      },
      { $set: { fancy_result: "declared" } }
    );
    const fancyTrans = await FancyTransaction.find({
      match_id: myobj.match_id,
      selection_id: myobj.selection_id,
    });

    for (let i = 0; i < fancyTrans.length; i++) {
      const currentFancy = fancyTrans[i];
      const exposure = -1 * parseFloat(currentFancy.bet_amount);

      const user = await User.findByIdAndUpdate(
        currentFancy.user_id,
        {
          $inc: {
            exposure: Math.abs(exposure),
          },
        },
        { returnDocument: "after" }
      );

      const fancyUpdate = await FancyTransaction.findByIdAndUpdate(
        currentFancy._id,
        {
          $set: {
            fancy_result: "abandoned",
          },
        }
      );
    }
    return res.status(200).json({ status: 1, msg: "Fancy Declared" });
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message });
  }
};

const getFancy = async (req, res) => {
  try {
    const undefinedFancy = await Fancy.find({ fancy_result: "undeclared" });
    if (undefinedFancy) {
      return res.status(200).json({ status: 1, dataobj: undefinedFancy });
    }
    return res.status(400).json({ msg: "Not Record Found" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
const getDeclareFancy = async (req, res) => {
  try {
    const undefinedFancy = await Fancy.find({ fancy_result: "declared" });
    if (undefinedFancy) {
      return res.status(200).json({ status: 1, dataobj: undefinedFancy });
    }
    return res.status(400).json({ msg: "Not Record Found" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
const getMatch = async (req, res) => {
  try {
    // Find all unique match_ids in the Transaction collection where bets are placed
    const betPlacedMatchIds = await Bet.distinct("match_id");

    if (betPlacedMatchIds.length === 0) {
      return res.status(200).json({ status: 0, dataobj: [] });
    }

    // Find undeclared matches from the Match collection that have bets placed
    const undefinedMatches = await Match.find({
      status: "undeclared",
      match_id: { $in: betPlacedMatchIds },
    });

    if (undefinedMatches.length > 0) {
      return res.status(200).json({ status: 1, dataobj: undefinedMatches });
    } else {
      return res.status(200).json({ status: 0, dataobj: [] });
    }
  } catch (error) {
    console.error("Error fetching matches:", error);
    return res.status(500).json({ msg: error.message });
  }
};

const getDeclareMatches = async (req, res) => {
  try {
    const undefinedMatch = await Match.find({ status: "declared" });

    if (undefinedMatch) {
      return res.status(200).json({ status: 1, dataobj: undefinedMatch });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  declareMatch,
  declareFancy,
  getFancy,
  getMatch,
  declareAbandonedOrTie,
  getDeclareMatches,
  undeclareMatch,
  undeclareFancy,
  declareAbandonedFancy,
  getDeclareFancy,
};
