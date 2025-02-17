const Matchlog = require("../Modal/Matchlog");
const User = require("../Modal/User");
const Transaction = require("../Modal/Bet");
const Fancy = require("../Modal/Fancy");
const FancyTransaction = require("../Modal/FancyTransaction");

const getLiveMatchReport = async (req, res) => {
  try {
    const myobj = req.body;
    const childUsers = await User.find({ parent_id: myobj.user_id });
    let finalPosOdds = { ...myobj.position };
    let finalPosBookmaker = { ...myobj.position };
    const intitalPos = myobj.position;
    console.log("Children", childUsers);
    for (child of childUsers) {
      console.log("Child", child);
      const matchlog = await Matchlog.findOne({
        user_id: child._id?.toString(),
        match_id: myobj.match_id,
      });
      console.log("MatchLOG", matchlog);
      let oddsPos = await Transaction.findById(
        matchlog?.last_odds_transaction_id
      );
      console.log("Odds", oddsPos);
      oddsPos = oddsPos?.position;
      bookMakerPos = await Transaction.findById(
        matchlog?.last_bookmaker_transaction_id
      );
      console.log("Book Maker", bookMakerPos);
      bookMakerPos = bookMakerPos?.position;

      for (key in intitalPos) {
        let finalEarningOdds = oddsPos?.[key] || 0;
        let finalEarningBookmaker = bookMakerPos?.[key] || 0;
        const share = child.other_match_share * 0.01;
        console.log(
          "Odds",
          finalEarningOdds,
          "finalToAdd",
          finalEarningOdds * share
        );
        console.log(
          "BookMaker",
          finalEarningBookmaker,
          "finalToAdd",
          finalEarningBookmaker * share
        );
        finalPosOdds[key] += finalEarningOdds * share;
        finalPosBookmaker[key] += finalEarningBookmaker * share;
      }
    }

    res.status(200).json({
      status: 1,
      dataobj: { odds: finalPosOdds, bookmaker: finalPosBookmaker },
    });
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message });
  }
};

const declaredFancy = async (req, res) => {
  try {
    const myobj = req.query;
    const fancies = await Fancy.find({
      match_id: myobj.match_id,
      fancy_result: { $ne: "undeclared" },
    });

    return res.status(200).json({ status: 1, dataobj: fancies });
  } catch (err) {
    return res.status(500).json({ status: 0, msg: err.message });
  }
};

const undeclaredFancy = async (req, res) => {
  try {
    const myobj = req.query;
    const fancies = await Fancy.find({
      match_id: myobj.match_id,
      fancy_result: "undeclared",
    });

    return res.status(200).json({ status: 1, dataobj: fancies });
  } catch (err) {
    return res.status(500).json({ status: 0, msg: err.message });
  }
};

const matchBets = async (req, res) => {
  try {
    const myobj = req.query;

    // Fetch child users
    const childUsers = await User.find({ parent_id: myobj.user_id });
    let allUserIds = childUsers.map((user) => user._id.toString());

    // Fetch bets
    const bets = await Transaction.find({
      match_id: myobj.match_id,
      user_id: { $in: allUserIds },
    });

    // Attach user details to each bet
    const betWithUsers = await Promise.all(
      bets.map(async (bet) => {
        const user = await User.findById(bet.user_id);
        return {
          ...bet._doc, // Ensure you access the actual document
          userDetails: user || null, // Attach user details or null if not found
        };
      })
    );

    // Return response
    return res.status(200).json({ status: 1, dataobj: betWithUsers });
  } catch (err) {
    return res.status(500).json({ status: 0, msg: err.message });
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

const sessionBets = async (req, res) => {
  try {
    const myobj = req.query;
    const users = await User.find({ parent_id: myobj.user_id });
    console.log("+++++++++");
    console.log({ users });
    console.log("+++++++++");
    let allChildId = users.map((item) => item._id.toString());
    console.log("+++++++++");
    console.log({ allChildId });
    console.log("+++++++++");
    const bets = await FancyTransaction.find({
      match_id: myobj.match_id,
      user_id: { $in: allChildId },
    });
    console.log("+++++++++");
    console.log({ bets });
    console.log("+++++++++");

    const betWithUsers = await Promise.all(
      bets.map(async (bet) => {
        const user = await User.findById(bet.user_id);
        return {
          ...bet._doc, // Ensure you access the actual document
          userDetails: user || null, // Attach user details or null if not found
        };
      })
    );

    return res.status(200).json({ status: 1, dataobj: betWithUsers });
  } catch (err) {
    return res.status(500).json({ status: 0, msg: err.message });
  }
};

const betSlips = async (req, res) => {
  try {
    const myobj = req.query;
    const currUser = await User.findById(myobj.user_id);
    const allChilds = await User.find({ parent_id: currUser?._id?.toString() });
    const Home = myobj.team1;
    const Away = myobj.team2;

    const childs = allChilds.map((child) => child?._id?.toString());
    const allBets = await Transaction.find({
      match_id: myobj.match_id,
      user_id: { $in: childs },
    });

    let result = [];
    for (let i = 0; i < allBets.length; i++) {
      const currBet = allBets[i];
      const findUser = allChilds.find(
        (user) => user?._id?.toString() == currBet.user_id
      );
      let betSlipObj = {
        date: currBet.createdAt,
        market_title: "Match Winner(" + currBet.type + ")",
        rate: currBet.bet_rate,
        amount: currBet.bet_amount,
        mode: currBet.bet_type,
        runner_name: currBet.bet_on,
        user_name: findUser.username,
        my_share: findUser.other_match_share,
        status: "Pending",
        settlement: "0.0",
      };

      if (currBet.type == "bookmaker") {
        let currBetNegative;
        if (currBet.bet_type == "khai") {
          currBetNegative = parseFloat(
            -0.01 * currBet.bet_rate * currBet.bet_amount
          );
          betSlipObj[Home + "_position"] =
            parseFloat(currBetNegative).toFixed(2);
          betSlipObj[Away + "_position"] = parseFloat(
            parseFloat(currBet.bet_amount)
          ).toFixed(2);
        } else if (currBet.bet_type == "lagai") {
          betSlipObj[Home + "_position"] = parseFloat(
            parseFloat(0.01 * currBet.bet_rate * currBet.bet_amount)
          ).toFixed(2);
          currBetNegative = parseFloat(-1 * currBet.bet_amount);
          betSlipObj[Away + "_position"] = parseFloat(currBetNegative);
        } else {
        }
      } else if (currBet.type == "odds") {
        let currBetNegative;
        if (myobj.bet_type == "khai") {
          currBetNegative = parseFloat(
            -1 * (myobj.bet_rate - 1) * myobj.bet_amount
          );
          betSlipObj[Home + "_position"] =
            parseFloat(currBetNegative).toFixed(2);
          betSlipObj[Away + "_position"] = parseFloat(
            parseFloat(myobj.bet_amount)
          ).toFixed(2);
        } else if (myobj.bet_type == "lagai") {
          betSlipObj[Home + "_position"] = parseFloat(
            parseFloat((myobj.bet_rate - 1) * myobj.bet_amount)
          ).toFixed(2);
          currBetNegative = parseFloat(-1 * myobj.bet_amount);
          betSlipObj[Away + "_position"] = parseFloat(currBetNegative);
        } else {
        }
      }

      betSlipObj[Home + "_share"] =
        parseFloat(betSlipObj.my_share) *
        0.01 *
        parseFloat(betSlipObj[Home + "_position"]);
      betSlipObj[Away + "_share"] =
        parseFloat(betSlipObj.my_share) *
        0.01 *
        parseFloat(betSlipObj[Away + "_position"]);
      result.push(betSlipObj);
    }
    return res.status(200).json({ status: 1, dataobj: result });
  } catch (err) {
    return res.status(500).json({ status: 1, msg: err.message });
  }
};

const sessionBetSlips = async (req, res) => {
  try {
    const myobj = req.query;
    const currUser = await User.findById(myobj.user_id);
    const allChilds = await User.find({ parent_id: currUser?._id?.toString() });

    const childs = allChilds.map((child) => child?._id?.toString());
    const allBets = await FancyTransaction.find({
      match_id: myobj.match_id,
      user_id: { $in: childs },
    });

    let result = [];
    for (let i = 0; i < allBets.length; i++) {
      const currBet = allBets[i];
      const findUser = allChilds.find(
        (user) => user?._id?.toString() == currBet.user_id
      );
      const yes_position =
        currBet.bet_type == "Yes"
          ? (currBet.bet_rate * 0.01 * currBet.bet_amount).toFixed(2)
          : (-1 * currBet.bet_amount).toFixed(2);
      const no_position =
        currBet.bet_type == "No"
          ? (currBet.bet_rate * 0.01 * currBet.bet_amount).toFixed(2)
          : (-1 * currBet.bet_amount).toFixed(2);

      let betSlipObj = {
        date: currBet.createdAt,
        fancy_id: currBet?.selection_id,
        session_title: currBet?.fancy_Detail?.runnerName,
        rate: (currBet.bet_rate * 0.01)?.toFixed(2),
        amount: currBet.bet_amount,
        mode: currBet.bet_type,
        runs: currBet?.fancy_Detail?.backPrice1,
        runner_name: currBet.bet_on,
        user_name: findUser.username,
        my_share: findUser.other_match_share,
        yes_position,
        no_position,
        yes_share: (yes_position * findUser?.other_match_share)?.toFixed(2),
        no_share: (no_position * findUser?.other_match_share)?.toFixed(2),
        status: currBet?.fancy_result != "undeclared" ? "Pending" : "Settled",
        settlement: ["Yes", "No"].includes(currBet?.fancy_result)
          ? currBet.fancy_result == "Yes"
            ? (yes_position * findUser?.other_match_share)?.toFixed(2)
            : (no_position * findUser?.other_match_share)?.toFixed(2)
          : "0.0",
      };

      result.push(betSlipObj);
    }
    return res.status(200).json({ status: 1, dataobj: result });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 0, msg: "Something went wrong" });
  }
};

// async (req, res) => {
//     try {

//     } catch (err) {
//       return res.status(500).json({ status: 0, msg: err.message });
//     }
//   };
module.exports = {
  getLiveMatchReport,
  sessionBets,
  declaredFancy,
  undeclaredFancy,
  matchBets,
  betSlips,
  sessionBetSlips,
};
