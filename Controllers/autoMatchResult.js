const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Transaction = require('../Modal/Bet');
const Match = require('../Modal/Match');
const {default: axios} = require('axios');

const getStartOfDay = date => {
  date.setHours(0, 0, 0, 0); // Set to start of the day
  return date;
};
const getEndOfDay = date => {
  date.setHours(23, 59, 59, 999); // Set to end of the day
  return date;
};

// get undeclare matches result
const autoDeclare = async (req, res) => {
  try {
    const today = new Date();
    const todayEnd = getEndOfDay(new Date(today));
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStart = getStartOfDay(new Date(yesterday));
    placeBetMatches = await Transaction.aggregate([
      {
        $match: {createdAt: {$gte: yesterdayStart}},
      },
      {
        $lookup: {
          from: 'matches',
          localField: 'match_id',
          foreignField: 'match_id',
          as: 'Matchdetails',
        },
      },
      {
        $unwind: '$Matchdetails',
      },
      {
        $match: {'Matchdetails.status': 'undeclared'},
      },
    ]);
    if (placeBetMatches && placeBetMatches.length > 0) {
      const results = await Promise.all(
        placeBetMatches.map(async element => {
          if (element.Matchdetails?.runners && element.market_id) {
            const odds = await getOdds(element.market_id);
            console.log('matchOdds', JSON.stringify(odds));

            // Match selectionId to runners in Matchdetails
            const winnerRunner = odds?.dataobj[0]?.runners.find(
              r => r.status === 'WINNER',
            );
            if (winnerRunner) {
              const winner = element.Matchdetails.runners.find(
                r => r.selectionId === winnerRunner.selectionId,
              )?.runnerName;
              const loser = element.Matchdetails.runners.find(
                r => r.selectionId !== winnerRunner.selectionId,
              )?.runnerName;

              if (winner && loser) {
                return {
                  match_id: element.match_id,
                  winner,
                  loser,
                };
              }
            }
          }
          return null; // Skip if no winner/loser found
        }),
      );

      // Filter out null values and return the results
      const payload = results.filter(result => result !== null);
      payload.forEach(async element => {
        await declareMatch(element);
      });
      console.log('payloadData', JSON.stringify(payload));
    }
    return res.status(200).json({status: 1, dataobj: placeBetMatches});
  } catch (error) {
    console.log(error);
  }
};
const getOdds = async market_id => {
  try {
    try {
      const response = await axios.get(
        'http://172.105.54.97:8085/api/new/GetMarketOdds',
        {
          params: {
            market_id: market_id,
          },
        },
      );

      if (response) return {status: 1, dataobj: response.data};
    } catch (err) {
      console.log(err);
      return JSON.stringify(err);
    }
  } catch (err) {
    console.log(err);
    return JSON.stringify(err);
  }
};

const getMatch = async () => {
  try {
    const undefinedMatch = await Match.find({status: 'undeclared'});

    if (undefinedMatch) {
      return res.status(200).json({status: 1, dataobj: undefinedMatch});
    }
  } catch (error) {
    return res.status(500).json({msg: error.message});
  }
};

const handleCollectionReport = async (user_id, amount, match_id) => {
  try {
    const currUser = await User.findById(user_id);
    if (currUser.parent_id && currUser.parent_id != '0') {
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
          {$inc: {amount: myShare}},
          {upsert: true},
        );
        await CollectionReport.findOneAndUpdate(
          {
            collect_from_user_id: user_id,
            user_id: currUser.parent_id,
            collect_from_username: currUser.username,
          },
          {$inc: {amount: collectBalance}},
          {upsert: true},
        );
        let setQuery = {
          $inc: {},
        };
        setQuery.$inc['profit_loss_ledger.' + match_id] =
          parseFloat(collectBalance);

        await ProfitLoss.findOneAndUpdate(
          {
            user_id: currUser.parent_id,
          },
          setQuery,
          {upsert: true},
        );
      } catch (er) {
        console.log(er);
      }
      console.log('My Match Share', currUser.my_match_share);

      handleCollectionReport(currUser.parent_id.toString(), amount, match_id);
    } else {
      console.log('My Match Share1', currUser.my_match_share);
    }
  } catch (err) {
    console.log('error123', err);
  }
};

var declareMatch = async myobj => {
  try {
    const undeclaredFancyRecord = await Fancy.findOne({
      match_id: myobj.match_id,
      fancy_result: 'undeclared',
    });
    console.log({undeclaredFancyRecord});
    // return res.status(200).json("TEST");
    const MatchRecord = await Match.findOneAndUpdate(
      {match_id: myobj.match_id},
      {
        $set: {
          winner: myobj.winner,
          loser: myobj.loser,
          status: 'declared',
        },
      },
      {returnDocument: 'after'},
    );

    let matchLogs = await MatchLog.find({match_id: myobj.match_id});
    let addToUser = [];
    const result = [];
    for (let i = 0; i < matchLogs.length; i++) {
      let reduceExposure = 0;
      const bookMakerBet = await Bet.findById(
        matchLogs[i].last_bookmaker_transaction_id,
      );
      const oddsBet = await Bet.findById(matchLogs[i].last_odds_transaction_id);
      console.log({bookMakerBet, oddsBet});
      // const oddsBet = await Bet.findById(matchLogs[i].last_fancy_transaction_id)
      const wonInBookMaker = bookMakerBet?.position[myobj.winner] || 0;
      const wonInOdds = oddsBet?.position[myobj.winner] || 0;
      const totalWinnings = parseFloat(wonInBookMaker) + parseFloat(wonInOdds);

      if (bookMakerBet?.position[myobj.winner] < 0) {
        console.log('Winner BookMaker');
        reduceExposure += parseFloat(bookMakerBet?.position[myobj.winner]);
      } else if (bookMakerBet?.position[myobj.loser] < 0) {
        console.log('Loser BookMaker');
        reduceExposure += parseFloat(bookMakerBet?.position[myobj.loser]);
      } else {
        console.log('NONe');
        console.log({winner: myobj.winner, losser: myobj.loser});
      }

      console.log({wonInBookMaker, wonInOdds, totalWinnings});

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
      console.log({reduceExposure});

      handleCollectionReport(
        matchLogs[i].user_id,
        totalWinnings,
        myobj.match_id,
      );
      const user = await User.findByIdAndUpdate(
        matchLogs[i].user_id,
        {
          $inc: {
            credits: totalWinnings,
            exposure: Math.abs(reduceExposure),
          },
        },
        {returnDocument: 'after'},
      );
      const credisTransction = new CreditTransactions({
        user_id: matchLogs[i].user_id,
        credit: totalWinnings > 0 ? totalWinnings : 0,
        debit: totalWinnings <= 0 ? totalWinnings : 0,
        description:
          (totalWinnings > 0 ? 'Profit in ' : 'Loss in ') +
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
      ).forEach(item => {
        WonInFancy += item?.amount_added;
      });
      console.log('THIS WAS PROBLEMATIC', {totalWinnings, WonInFancy});
      const newMatchLogs = await MatchLog.findOneAndUpdate(
        {match_id: myobj.match_id, user_id: matchLogs[i].user_id},
        {
          $set: {
            match_result: 'declared',
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
        {returnDocument: 'after'},
      );

      console.log({newMatchLogs});

      addToUser.push({totalLoss, totalWinnings});
      // addToUser.push(bookMakerBet.position[myobj.winner]);
      // const user = await User.findById(matchLogs[i].user_id);
      result.push(user);
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  autoDeclare,
};
