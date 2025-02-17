const CollectionReport = require('../Modal/CollectionReport');
const CreditTransactions = require('../Modal/CreditTransactions');
const FancyTransaction = require('../Modal/FancyTransaction');
const Transaction = require('../Modal/Bet');
const Matchlog = require('../Modal/Matchlog');
const ProfitLoss = require('../Modal/ProfitLoss');
const User = require('../Modal/User');
const WinningLimit = require('../Modal/WinningLimit');
const Match = require('../Modal/Match');

const addUser = async (req, res) => {
  //Post Req
  try {
    const isExisting = await User.findOne({username: req.body.username});
    console.log({isExisting});
    if (isExisting)
      return res
        .status(400)
        .json({status: 1, msg: 'User Exist with same User Name.'});
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
      credits: req.body.credits,
      user_type: req.body.user_type,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      fix_limit: req.body.fix_limit,
      my_match_share: req.body.my_match_share,
      other_match_share: req.body.other_match_share,
      match_commission: req.body.match_commission,
      session_commission: req.body.session_commission,
      parent_id: req.body.parent_id,
    });
    try {
      const user = await newUser.save();
      return res.status(201).json(user);
    } catch (err) {
      return res.status(500).json(err);
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

// const getUsers = async (req, res) => {
//   const { user_type, user_id } = req.query;

//   try {
//     // Step 1: Fetch direct child users based on user_type and parent_id
//     const users = await User.find(
//       { user_type, parent_id: user_id },
//       { password: 0 } // Exclude password
//     ).sort({ createdAt: -1 });

//     if (users.length === 0) {
//       return res.status(404).json({ message: "No users found" });
//     }

//     // Step 2: Recursively fetch all sub-user IDs for each child user
//     const fetchAllSubUserIds = async (parentIds) => {
//       const subUsers = await User.find({ parent_id: { $in: parentIds } }, { _id: 1 });
//       const subUserIds = subUsers.map((user) => user._id);

//       if (subUserIds.length === 0) return []; // Base case: No more sub-users

//       const deeperSubUserIds = await fetchAllSubUserIds(subUserIds); // Recursive call
//       return [...subUserIds, ...deeperSubUserIds];
//     };

//     // Step 3: Calculate profit/loss for each direct child user
//     const usersWithProfitLoss = await Promise.all(
//       users.map(async (user) => {
//         const allSubUserIds = await fetchAllSubUserIds([user._id]); // Get all sub-user IDs
//         const relevantUserIds = [user._id, ...allSubUserIds]; // Include the child user's ID

//         // Step 4: Fetch and filter transactions for relevant user IDs
//         const transactions = await CreditTransactions.find({
//           user_id: { $in: relevantUserIds },
//           deposited_by: { $exists: false },
//           withdrawn_by: { $exists: false },
//         });
//         console.log(JSON.stringify(transactions));
//         // Step 5: Parse debit and credit amounts correctly and calculate profit/loss
//         const profitLoss = transactions.reduce(
//           (acc, transaction) => {
//             acc.debit += parseFloat(transaction.debit) || 0; // Parse debit as float
//             acc.credit += parseFloat(transaction.credit) || 0; // Parse credit as float
//             return acc;
//           },
//           { debit: 0, credit: 0 }
//         );

//         const totalProfitLoss = profitLoss.credit + profitLoss.debit; // Final profit/loss

//         // Fetch winning limits for the current user
//         const winningLimits = await WinningLimit.find({ user_id: user._id });

//         // Return the user object with profit/loss and winning limits
//         return {
//           ...user._doc, // Spread user data
//           profitLoss: totalProfitLoss.toFixed(2), // Format to 2 decimal places
//           winningLimits, // Attach winning limits
//         };
//       })
//     );

//     // Step 6: Send the response with users and their profit/loss
//     return res.status(200).json({ data: usersWithProfitLoss });
//   } catch (err) {
//     return res.status(500).send({ error: err.message });
//   }
// };



const getUser = async (req, res) => {
  const myobj = req.query;
  const username = myobj.username;
  try {
    const user = await User.findOne({username}, {password: 0});
    return res.status(200).json({user});
  } catch (error) {
    console.error('Error retrieving user by username:', error);
    return res.status(500).send({error: err.message});
  }
};

const updateUser = async (req, res) => {
  const myobj = req.query;
  const _id = myobj._id;
  console.log(req.body);
  try {
    // const { first_name, last_name, fix_limit,session_commission,agent_block,bets_block} = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.body._id,
      {$set: req.body},
      {new: true},
    );

    console.log(updatedUser);

    if (!updatedUser) {
      return res.status(404).json({error: 'User not found'});
    }

    // Respond with the updated user
    res.status(200).json(updatedUser);
  } catch (err) {
    return res.status(500).send({error: err.message});
  }
};

const updateWinningLimit = async (req, res) => {
  try {
    const {user_id, sports, profit_limit, member_max_credit} = req.body; // `sports` is an array of sport objects

    // Validate the request
    if (!user_id || !Array.isArray(sports) || sports.length === 0) {
      return res.status(400).json({
        error:
          'User ID and sports array are required, and sports array should not be empty.',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      {
        $set: {
          profit_limit: profit_limit || 0,
          member_max_credit: member_max_credit || 0,
        },
      },
      {new: true}, // Return the updated document
    );

    // Handle cases where the user is not found
    if (!updatedUser) {
      return res.status(404).json({error: 'User not found'});
    }

    // Loop through the sports array and update limits for each sport
    const promises = sports.map(async sportObj => {
      const {
        sport,
        fancy_winning_limit,
        book_market_winning_limit,
        sport_limit,
      } = sportObj;

      // Validate individual sport object
      if (!sport) {
        throw new Error('Each sport object must contain a sport name.');
      }

      // Find the winning limit for the user and sport, or create a new one
      return await WinningLimit.findOneAndUpdate(
        {user_id, sport}, // Filter by user ID and sport
        {
          $set: {
            fancy_winning_limit: fancy_winning_limit || 0,
            book_market_winning_limit: book_market_winning_limit || 0,
            sport_limit: sport_limit || 0,
          },
        },
        {new: true, upsert: true}, // `upsert` will create a new document if not found
      );
    });

    // Wait for all updates to complete
    const updatedLimits = await Promise.all(promises);

    res.status(200).json({
      message: 'Winning limits and user details updated successfully',
      user: updatedUser,
      limits: updatedLimits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({error: error.message});
  }
};

const changeUserPassword = async (req, res) => {
  const myobj = req.query;
  console.log(req.body);
  try {
    // const { first_name, last_name, fix_limit,session_commission,agent_block,bets_block} = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.body.username,
      {$set: req.body},
      {new: true},
    );

    console.log(updatedUser);

    if (!updatedUser) {
      return res.status(404).json({error: 'User not found'});
    }

    // Respond with the updated user
    res.status(200).json(updatedUser);
  } catch (err) {
    return res.status(500).send({error: err.message});
  }
};

const getUserLedger = async (req, res) => {
  try {
    const myobj = req.query;
    const ledgerRecords = await Matchlog.find({
      user_id: myobj.user_id,
      match_result: 'declared',
    });
    return res.status(200).json({status: 1, dataobj: ledgerRecords});
  } catch (err) {
    console.log(err);
    return res.status(500).json({status: 0, msg: err.message});
  }
};

const getUserStatement = async (req, res) => {
  try {
    const myobj = req.query;
    const startDate = new Date(myobj.startDate);
    const endDate = new Date(myobj.endDate);

    // Set the time for start and end dates
    startDate.setHours(0, 0, 0, 0); // Start of the day (midnight)
    endDate.setHours(23, 59, 59, 999); // End of the day (just before midnight)

    // Find transactions based on user_id and the date range
    const statement = await CreditTransactions.find({
      user_id: myobj.user_id,
      createdAt: {
        $gte: startDate, // Greater than or equal to startDate
        $lte: endDate,   // Less than or equal to endDate
      },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ status: 1, dataobj: statement });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 0, msg: err.message });
  }
};

const getMyClient = async (req, res) => {
  const myobj = req.query;
  const user_id = myobj._id;
  try {
    const data = await User.find({parent_id: user_id}).select({
      password: 0,
    });

    return res.status(200).json({status: 1, dataobj: data});
  } catch (err) {
    return res.status(500).send({error: err.message});
  }
};
const getBlockedClient = async (req, res) => {
  const myobj = req.query;
  const user_id = myobj._id;
  try {
    const data = await User.find({
      parent_id: user_id,
      agent_block: true,
    }).select({password: 0});

    return res.status(200).json({status: 1, dataobj: data});
  } catch (err) {
    return res.status(500).send({error: err.message});
  }
};

const getUsers = async (req, res) => {
  const { user_type, user_id } = req.query;

  try {
    // Step 1: Fetch direct child users based on user_type and parent_id
    const users = await User.find(
      { user_type, parent_id: user_id },
      { password: 0 } // Exclude password
    ).sort({ createdAt: -1 });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    // Step 2: Calculate profit/loss for each direct child user
    const usersWithProfitLoss = await Promise.all(
      users.map(async (user) => {

        const collectionReport = await CollectionReport.findOne({
          user_id: user_id,
          collect_from_user_id:user._id
        }); 
        const winningLimits = await WinningLimit.find({ user_id: user._id });

        return {
          ...user._doc, // Spread user data
          profitLoss: collectionReport?.amount.toFixed(2) || 0, // Format to 2 decimal places
          winningLimits, // Attach winning limits
        };
      })
    );

    // Step 5: Send the response with users and their profit/loss
    return res.status(200).json({ data: usersWithProfitLoss });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
};

const getCollectionReport = async (req, res) => {
  try {
    const collectionReports = await CollectionReport.find({
      user_id: req.query.user_id,
    });
    const userIds = [...new Set(collectionReports.map(report => report.collect_from_user_id))];
    console.log(userIds);
    const users = await User.find({ _id: { $in: userIds }}).select('-password');

    const userMap = users.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const collectionReportsWithUserDetails = collectionReports.map(report => ({
      ...report.toObject(),
      collect_from_user: userMap[report.collect_from_user_id],
    }));

    return res.status(200).json({ status: 1, dataobj: collectionReportsWithUserDetails });
  } catch (err) {
    console.log(err);
    return res.status(500).json({status: 0, msg: err.message});
  }
};


const settleCollectionReport = async(req,res)=>{
  try{
    const myobj = req.body;
    const { type, collectionReports } = myobj;
    const results = [];
    for (let report of collectionReports) {
      const { report_id, transactionValues, remark } = report;
      const transactionValue = parseFloat(transactionValues);

      const collectionReport = await CollectionReport.findById(report_id);
      if (!collectionReport) {
        console.log(`Collection report with ID ${report_id} not found.`);
        continue;
      }

      const userId = collectionReport.collect_from_user_id;
      const user = await User.findById(userId);
      if (!user) {
        console.log(`User with ID ${userId} not found.`);
        continue;
      }

      const parentUserId = collectionReport.user_id; // Assuming this is the parent user ID
      const parentUser = await User.findById(parentUserId);
      if (!parentUser) {
        console.log(`Parent user with ID ${parentUserId} not found.`);
        continue;
      }

      if (type === "dena") {
        // `dena`: Subtract from collection report, user, and add to parent user
        collectionReport.amount -= transactionValue;
        user.credits -= transactionValue;
        parentUser.credits -= transactionValue;

        // Create Credit Transaction for user
        const creditTransaction = new CreditTransactions({
          user_id: userId,
          credit: 0, // No credit, only debit
          debit: transactionValue,
          description: `Debited`,
          balance: user.credits,
          date: new Date().toString(),
        });
        await creditTransaction.save();

        const parentCreditTransaction = new CreditTransactions({
          user_id: parentUserId,
          credit: 0, // No credit, only debit
          debit: transactionValue,
          description: `Settlement`,
          balance: parentUser.credits,
          date: new Date().toString(),
          remark: remark
        });
        await parentCreditTransaction.save();

      } else if (type === "lena") {
        // `lena`: Add to collection report, user, and subtract from parent user
        collectionReport.amount += transactionValue;
        user.credits += transactionValue;
        parentUser.credits += transactionValue;

        // Create Credit Transaction for user
        const creditTransaction = new CreditTransactions({
          user_id: userId,
          credit: transactionValue, // Credit amount for user
          debit: 0,
          description: `Credited`,
          balance: user.credits,
          date: new Date().toString(),
        });
        await creditTransaction.save();

        const parentCreditTransaction = new CreditTransactions({
          user_id: parentUserId,
          credit: transactionValue, // Credit amount for user
          debit: 0,
          description: `Settlement`,
          balance: parentUser.credits,
          date: new Date().toString(),
          remark: remark
        });
        await parentCreditTransaction.save();
      } else {
        console.log(`Invalid type: ${type}. Skipping transaction.`);
        continue;
      } 
      await collectionReport.save();
      await user.save();
      await parentUser.save();

      // Add result for this report
      results.push({
        report_id,
        user_id: userId,
        parent_user_id: parentUserId,
        new_balance: user.credits,
        parent_balance: parentUser.credits,
        remark,
      });
    }
    return res.status(200).json({status: 1, dataobj: results});
  }catch (error) {
    console.error("Error processing collection reports:", error);
    throw error;
  }

}

const getCommissionAndLimit = async (req, res) => {
  try {
    const commission = await User.aggregate([
      {
        $match: {
          user_type: {$nin: ['super_admin', 'admin']}, // Filter out users with specified user types
        },
      },
      {
        $lookup: {
          from: 'users', // Collection name where you want to lookup
          let: {parentIdString: {$toString: '$_id'}}, // Convert _id to string
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$$parentIdString', '$parent_id'], // Compare as strings
                },
              },
            },
          ],
          as: 'children', // Store matching documents where current user's ID is parent_id
        },
      },
      {
        $addFields: {
          down_limit: {$sum: '$children.credits'}, // Calculate the sum of credits for the current user
          children: '$children',
        },
      },
    ]);

    return res.status(200).json({status: 1, dataobj: commission});
  } catch (err) {
    console.log(err);
    return res.status(500).json({status: 0, msg: err.message});
  }
};

const getMatchBetsOfMatchOfUser = async (req, res) => {
  try {
    const myobj = req.query;
    const matchBets = await Transaction.find({
      user_id: myobj.user_id,
      match_id: myobj.match_id,
    });
    return res.status(200).json({status: 1, dataobj: matchBets});
  } catch (err) {
    console.log(err);
    return res.status(500).json({status: 0, msg: 'Internal Server error'});
  }
};

const getFancyBetsOfMatchOfUser = async (req, res) => {
  try {
    const myobj = req.query;
    const fancyBets = await FancyTransaction.find({
      user_id: myobj.user_id,
      match_id: myobj.match_id,
    });
    return res.status(200).json({status: 1, dataobj: fancyBets});
  } catch (err) {
    console.log(err);
    return res.status(500).json({status: 0, msg: 'Internal Server error'});
  }
};

const depositToUser = async (req, res) => {
  try {
    const myobj = req.body;

    // Validate amount
    if (isNaN(myobj.amount)) {
      return res.status(400).json({ status: 0, msg: 'Amount must be a number' });
    }
    if (myobj.amount <= 0) {
      return res.status(400).json({ status: 0, msg: 'Amount must be positive' });
    }

    // Fetch the depositor's account to ensure sufficient credits
    const depositor = await User.findById(myobj.deposited_by);
    if (!depositor) {
      return res.status(404).json({ status: 0, msg: 'Depositor not found' });
    }
    if (depositor.credits < myobj.amount) {
      return res.status(400).json({ status: 0, msg: 'Insufficient balance' });
    }

    const recipient = await User.findById(myobj.deposit_to);
    if (!recipient) {
      return res.status(404).json({ status: 0, msg: 'Recipient not found' });
    }

    const newCreditLimit = myobj.newcreditlimit ?? recipient.member_max_credit;
    const totalCreditsAfterDeposit = recipient.credits + parseFloat(myobj.amount);

    // Validate if the total credits exceed the allowed limit
    if (newCreditLimit > 0 && totalCreditsAfterDeposit > newCreditLimit) {
      return res.status(400).json({
        status: 0,
        msg: 'Deposit exceeds the allowed credit limit',
      });
    }


    // Perform atomic update to both depositor and recipient accounts
    const session = await User.startSession(); // Start a session for transactions
    session.startTransaction();

    try {
      // Deduct from depositor's credits
      await User.findByIdAndUpdate(
        myobj.deposited_by,
        { $inc: { credits: -parseFloat(myobj.amount) } },
        { session }
      );

      // Add to recipient's credits
      const recipientUpdate = { $inc: { credits: parseFloat(myobj.amount) } };
      if (myobj.newcreditlimit !== undefined) {
        recipientUpdate.$set = { member_max_credit: myobj.newcreditlimit };
      }

      // Add to recipient's credits and optionally update the credit limit
      const updatedRecipient = await User.findByIdAndUpdate(
        myobj.deposit_to,
        recipientUpdate,
        { session, returnDocument: 'after' }
      );


      // Save the transaction record
      const newCreditTrans = new CreditTransactions({
        user_id: myobj.deposit_to,
        credit: parseFloat(myobj.amount),
        debit: 0,
        deposited_by: myobj.deposited_by,
        description: 'Money Deposited',
        balance: recipient.credits,
        date: new Date().toString(),
        remark: myobj.remark
      });

      await newCreditTrans.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ status: 1, msg: 'Amount Deposited Successfully' });
    } catch (err) {
      // Rollback if anything goes wrong
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message });
  }
};

const withdrawFromUser = async (req, res) => {
  try {
    const myobj = req.body;

    // Validate amount
    if (isNaN(myobj.amount))
      return res.status(400).json({ status: 0, msg: 'Amount must be a number' });

    if (myobj.amount <= 0)
      return res.status(400).json({ status: 0, msg: 'Amount must be positive' });

    // Start a session for atomic transactions
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Fetch the user making the withdrawal
      const withdrawer = await User.findById(myobj.withdraw_from);
      if (!withdrawer) {
        throw new Error('Withdrawer not found');
      }

      // Check if the withdrawer has enough balance
      if (withdrawer.credits < myobj.amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct the amount from the withdrawer
      await User.findByIdAndUpdate(
        myobj.withdraw_from,
        { $inc: { credits: -1 * parseFloat(myobj.amount) } },
        { session }
      );

      // Add the amount to the receiver
      const receiver = await User.findByIdAndUpdate(
        myobj.withdrawn_by,  // The receiver of the amount
        { $inc: { credits: parseFloat(myobj.amount) } },
        { session, returnDocument: 'after' }
      );

      // Create a new transaction entry
      const newCreditTrans = new CreditTransactions({
        user_id: myobj.withdraw_from,
        credit: 0,
        debit: parseFloat(myobj.amount),
        withdrawn_by: myobj.withdrawn_by,
        description: 'Money Withdrawn',
        balance: withdrawer.credits - parseFloat(myobj.amount),  // Updated balance after withdrawal
        date: new Date().toString(),
        remark: myobj.remark
      });

      // Save the transaction record
      await newCreditTrans.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ status: 1, msg: 'Amount Withdrawn and Deposited Successfully' });
    } catch (error) {
      // Rollback the transaction in case of error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ status: 0, msg: err.message });
  }
};

const getBalanceAndExposure = async (req, res) => {
  const myobj = req.query;
  const _id = myobj._id;
  try {
    const user = await User.findOne({_id}, {password: 0});
    console.log(user);
    return res
      .status(200)
      .json({balance: user.credits, exposure: user.exposure});
  } catch (err) {
    console.error('Error retrieving user by username:', err);
    return res.status(500).send({error: err.message});
  }
};

const getProfitAndLossOfCompletedMatchs = async (req, res) => {
  try {
    const body = await ProfitLoss.findOne({user_id: req.body.user_id});
    res.status(200).json({status: 1, dataobj: body});
  } catch (err) {
    res.status(500).json({status: 0, msg: err.message});
  }
};

const getUsersWithProfitLoss = async (req, res) => {
  const myobj = req.query;
  const user_type = myobj.user_type; // The user type to filter (can be 'superadmin', 'admin', 'supermaster', 'master', or 'user')
  const user_id = myobj.user_id; // The parent ID to look for

  try {
    const childUserIds = await getAllChildUserIdsRecursively(user_id);

    // Return users with their winning limits and profit/loss
    return res.status(200).json({ data: childUserIds });
  } catch (err) {
    return res.status(500).send({ error: err.message });
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


const getMyMatchedMarket = async (req, res) => {
  try {
    const { user_id } = req.query;

    // Step 1: Retrieve all transactions for the user from both collections
    const userTransactions = await Transaction.find({ user_id });
    const userFancyTransactions = await FancyTransaction.find({ user_id });

    // Step 2: Combine all transactions and count occurrences by match_id
    const transactionCounts = [...userTransactions, ...userFancyTransactions].reduce((acc, transaction) => {
      const matchId = transaction.match_id;
      acc[matchId] = (acc[matchId] || 0) + 1;
      return acc;
    }, {});

    // Step 3: Extract unique match IDs that have bets
    const allMatchIds = Object.keys(transactionCounts);

    // Step 4: Query the Match model to find undeclared matches and use .lean() to get plain objects
    const undeclaredMatches = await Match.find({
      match_id: { $in: allMatchIds },
      status: "undeclared",
    }).lean();

    // Step 5: Attach bet count to each undeclared match
    const result = undeclaredMatches.map(match => ({
      ...match,
      bet_count: transactionCounts[match.match_id] || 0,
    }));

    return res.status(200).json({ status: 1, undeclaredMatches: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, msg: 'Internal Server error' });
  }
};

module.exports = {
  addUser,
  getUsers,
  getUser,
  updateUser,
  updateWinningLimit,
  changeUserPassword,
  getUserLedger,
  getMyMatchedMarket,
  getUserStatement,
  getMyClient,
  getBlockedClient,
  getCollectionReport,
  settleCollectionReport,
  getCommissionAndLimit,
  depositToUser,
  withdrawFromUser,
  getBalanceAndExposure,
  getProfitAndLossOfCompletedMatchs,
  getFancyBetsOfMatchOfUser,
  getMatchBetsOfMatchOfUser,
  getUsersWithProfitLoss
};
