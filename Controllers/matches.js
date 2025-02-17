const { default: axios } = require("axios");
const Match = require("../Modal/Match");
const Transaction = require('../Modal/Bet');
const FancyTransaction = require("../Modal/FancyTransaction");
 
const liveCricketMatches = async (req, res) => {
  
  try {
    const { sportId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // For test matches

    const matchQuery = {
      status: "undeclared",
      type: sportId === "4" ? "cricket" : sportId === "1" ? "soccer" : "tennis",
    };

    // Fetch cricket matches from the past 3 days, otherwise today's matches
    matchQuery.start_time = sportId === "4" ? { $gte: threeDaysAgo } : { $gte: today };
    // await Match.updateMany(
    //   {}, 
    //   { $set: { is_block: false } } 
    // )
    // Fetch matches with pagination
    const matches = await Match.find(matchQuery)
      .sort({ start_time: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Fetch odds for each match
    const matchPromises = matches.map(async (match) => {
      try {
        // Get market list for the match
        const marketList = await axios.get(
          "http://172.105.54.97:8085/api/new/geMarketsList",
          {
            params: {
              EventID: match.match_id,
              sportid: sportId,
            },
          }
        );

        let oddsMarketId = null;

        // Check if marketList has items
        if (marketList.data && marketList.data.length > 0) {
          const market = marketList.data.find((m) => m.marketName === "Match Odds");
          oddsMarketId = market ? market.marketId : null; // Use marketId correctly
        }

        // Initialize oddsData as null
        let oddsData = null;

        // Fetch odds for the identified market
        if (oddsMarketId) {
          const response = await axios.get(
            "http://172.105.54.97:8085/api/new/GetMarketOdds",
            {
              params: {
                market_id: oddsMarketId,
                sportid: sportId,
              },
            }
          );
          oddsData = response.data; // Store odds data
        }

       const totalMatchBets = await Transaction.find({
          match_id: match.match_id,
        });

        const fancyBets = await FancyTransaction.find({
          match_id: match.match_id,
        });

        return { ...match._doc, odds: oddsData,totalMatchBets:totalMatchBets.length+fancyBets.length }; // Return oddsData or null
      } catch (err) {
        console.error(`Error fetching odds for match ${match.match_id}:`, err);
        return { ...match._doc, odds: null }; // Handle API errors gracefully
      }
    });

    const results = await Promise.all(matchPromises); // Wait for all promises to resolve
    const results1 = results.filter(res=>{return res.odds !== null});
    // Return the results with matches, including those with null odds
    //return res.status(200).json({ status: 1, dataobj: results1 }); ---Old response
    return res.status(200).json({ status: 1, dataobj:[...new Map(results1.map(item => [item.match_id, item])).values()] });
  } catch (error) {
    console.error("Error in liveCricketMatches:", error);
    return res.status(500).json({ msg: error.message });
  }
};
const matchesBlocking = async (req, res) => {
  
  try {

      // Validate input
    if (!req.body._id || typeof req.body.is_block === 'undefined') {
      return res.status(400).json({ status: 0, msg: "Invalid input: _id and is_block are required" });
    }

    // Update the document
    const data = await Match.findByIdAndUpdate(
      req.body._id, // Find by _id
      { $set: { is_block: req.body.is_block } }, // Update the is_block field
      { new: true } // Return the updated document
    );

    // Handle case when no document matches the query
    if (!data) {
      return res.status(404).json({ status: 0, msg: "Match not found" });
    }

    // Return success response
    return res.status(200).json({ status: 1, dataobj: data });
  } catch (error) {
    console.error("Error in liveCricketMatches:", error);
    return res.status(500).json({ msg: error.message });
  }
};


const inplayMatchesForAllSports = async (req, res) => {
  try {
    const sports = [
      { id: "4", name: "cricket" },
      { id: "1", name: "soccer" },
      { id: "3", name: "tennis" },
    ];

    // Create an object to hold the results for each sport
    const results = {};

    // Get today's date and the date from three days ago
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); 

    // Loop through each sport and fetch the matches
    await Promise.all(sports.map(async (sport) => {
      const matchQuery = {
        status: "undeclared",
        type: sport.name,
        start_time: sport.id === "4" ? { $gte: threeDaysAgo } : { $gte: today },
      };

      // Fetch matches for the current sport
      const matches = await Match.find(matchQuery)
        .sort({ start_time: 1 })
        .limit(500); // Limit can be set based on your requirements

      // Fetch odds for each match
      const matchPromises = matches.map(async (match) => {
        try {
          // Get market list for the match
          const marketList = await axios.get(
            "http://172.105.54.97:8085/api/new/geMarketsList",
            {
              params: {
                EventID: match.match_id,
                sportid: sport.id,
              },
            }
          );

          let oddsMarketId = null;

          // Check if marketList has items
          if (marketList.data && marketList.data.length > 0) {
            const market = marketList.data.find((m) => m.marketName === "Match Odds");
            oddsMarketId = market ? market.marketId : null; // Use marketId correctly
          }

          // Initialize oddsData as null
          let oddsData = null;

          // Fetch odds for the identified market
          if (oddsMarketId) {
            const response = await axios.get(
              "http://172.105.54.97:8085/api/new/GetMarketOdds",
              {
                params: {
                  market_id: oddsMarketId,
                  sportid: sport.id,
                },
              }
            );
            oddsData = response.data; // Store odds data
          }

          return { ...match._doc, odds: oddsData };
        } catch (err) {
          console.error(`Error fetching odds for match ${match.match_id}:`, err);
          return { ...match._doc, odds: null }; // Handle API errors gracefully
        }
      });

      const resultsForSport = await Promise.all(matchPromises); // Wait for all promises to resolve

      // Filter matches where odds exist and inplay is true in the 0th element
      const filteredMatches = resultsForSport.filter(match => 
        match.odds && match.odds.length > 0 && match.odds[0].inplay === true
      );

      // Store the results in the results object
      results[sport.name] = filteredMatches;
    }));

    // Return the final response with all sports
    return res.status(200).json({ status: 1, data: results });
  } catch (error) {
    console.error("Error in liveMatchesForAllSports:", error);
    return res.status(500).json({ msg: error.message });
  }
};



const upcommingCricketMatches = async (req,res) => {
    try {
      const currentDateTime = new Date();
      var matches =await Match.find({
        start_time: { $gt: currentDateTime },
        status: "undeclared",
      });
      console.log(matches)
      return res.status(200).json({status:1,dataobj:matches});
    } catch (error) {
        console.log(error)
      return res.status(500).json({msg: error.message});
    }
  };
const completedCricketMatches = async (req,res)=>{
  try {
    const currentDateTime = new Date();
    var matches =await Match.find({
      status: "declared",
    });
    console.log(matches)
    return res.status(200).json({status:1,dataobj:matches});
  } catch (error) {
      console.log(error)
    return res.status(500).json({msg: error.message});
  }
}

const getMatchDetails = async (req, res) => {
  try {
    const matchDetails = await Match.find({ match_id: req.params.matchId });

    if (matchDetails) {
      return res.status(200).json({ status: 1, dataobj: matchDetails });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
module.exports ={liveCricketMatches,upcommingCricketMatches,completedCricketMatches,inplayMatchesForAllSports,getMatchDetails,matchesBlocking}
