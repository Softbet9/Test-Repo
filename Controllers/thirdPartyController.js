const { default: axios } = require("axios");
const Match = require("../Modal/Match");

const getData = async (req, res) => {
  //Post
  try {
    try {
      const response = await axios.get(
        "https://jsonplaceholder.typicode.com/posts"
      );

      if (response) return res.status(200).json(response.data);
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

//http://103.105.251.169:5500/api/getSeriesList?sport_id=4
//GET

const getScore = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      console.log("Hitting External API");
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/Scorecard",
        {
          params: {
            eventid: myobj.match_id,
          },
          headers: {
            "content-type": "application/json",
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};
const getSeriesList = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      console.log("Hitting External API");
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/getCompetitions",
        {
          params: {
            id: myobj.sport_id,
          },
          headers: {
            "content-type": "application/json",
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};
//http://103.105.251.169:5500/api/getAllMatchesList?series_id=101480&sport_id=4
const getAllMatchesList = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/getEvents",
        {
          params: {
            sportid: myobj.sport_id,
            sid: myobj.series_id,
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getMarketList = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/geMarketsList",
        {
          params: {
            EventID: myobj.match_id,
            sportid: "4",
          },
        }
      );

      if (response) {
        if (response.data.length == 0)
          return res.status(200).json({ status: 0, msg: "No Data provided!" });
        return res.status(200).json({ status: 1, dataobj: response.data });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getRunners = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/geRunners",
        {
          params: {
            MarketID: myobj.market_id,
            sportid: "4",
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

// http://103.105.251.169:5500/api/LiveLine?match_id=32306306
const bookMakerMarket = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/BookmakerMarket",
        {
          params: {
            eventid: myobj.match_id,
            sportid: "4",
          },
        }
      );
      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};
const diamondFancy = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/diamondFancy2",
        {
          params: {
            id: myobj.match_id,
            sportid: "4",
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json("API FAILED");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getOdds = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/GetMarketOdds",
        {
          params: {
            market_id: myobj.market_id,
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json(err);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getFancyResult = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/Fancyresult",
        {
          params: {
            eventid: myobj.match_id,
            sportid: "4",
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json(err);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getLiveTVURL = async (req, res) => {
  const myobj = req.query;
  try {
    try {
      const response = await axios.get(
        "https://dpmatka.in/dcasino/nntv.php",
        {
          params: {
            MatchID: myobj.match_id,
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log(err);
      return res.status(400).json(err.message);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const fancyDeclartion = async (req, res) => {
  const myobj = req.query;
  // console.log("req",req);
  console.log("myobj", myobj.eventid);
  try {
    try {
      const response = await axios.get(
        "http://172.105.54.97:8085/api/new/Fancyresult",
        {
          params: {
            eventid: myobj.eventid,
          },
        }
      );

      if (response)
        return res.status(200).json({ status: 1, dataobj: response });
    } catch (err) {
      // console.log(err);
      return res.status(400).json(err.message);
    }
  } catch (err) {
    // console.log(err);
    // return res.status(500).json(err);
  }
};

const saveMatchesCricket = async (req, res) => {
    try {
      const sportTypes = {
        4: "cricket",
        1: "soccer",
        2: "tennis",
      };
      
      // Loop through each sport type
      for (const [sportId, sportName] of Object.entries(sportTypes)) {
      
        const response = await axios.get(
          "http://172.105.54.97:8085/api/new/getCompetitions",
          {
            params: {
              id: sportId, // Dynamic sport ID
            },
            headers: {
              "content-type": "application/json",
            },
          }
        );
        let AllMatches = {};
        if (response.data) {
      
          for (let i = 0; i < response.data.length; i++) {
            const series = response.data[i];
            const seriesName = series?.competition?.name;
            AllMatches[seriesName] = [];
            const seriesMatches = await axios.get(
              "http://172.105.54.97:8085/api/new/getEvents",
              {
                params: {
                  sportid: sportId, // Dynamic sport ID
                  sid: series?.competition?.id,
                },
              }
            );
      
            AllMatches[seriesName] = seriesMatches.data;
            const matches = seriesMatches?.data;
            for (let j = 0; j < matches?.length || 0; j++) {
              const match_id = matches[j].event.id;
              const match = matches[j].event;
              const isMatchOld = await Match.findOne({
                match_id: match_id,
              });
              if (!isMatchOld) {
                const marketList = await axios.get(
                  "http://172.105.54.97:8085/api/new/geMarketsList",
                  {
                    params: {
                      EventID: match_id,
                    },
                  }
                );
      
                let runners;
                if (Array.isArray(marketList.data)) {
                  runners = marketList.data.find(
                    (item) => item.marketName === "Match Odds"
                  );
                } else {
                  console.log("marketList.data is not an array or is undefined.");
                }
      
                if (!runners) {
                  continue;
                }
      
                const runnerResponse = await axios.get(
                  "http://172.105.54.97:8085/api/new/geRunners",
                  {
                    params: {
                      MarketID: runners.marketId,
                    },
                  }
                );
                runners = runnerResponse.data[0]?.runners;
                if (!runners) continue;
      
                const team1 = runners[0]?.runnerName;
                const team2 = runners[1]?.runnerName;
      
                const newMatch = new Match({
                  match_id: match_id,
                  matchObj: match,
                  start_time: new Date(match.openDate),
                  match_name: match.name,
                  team1: team1,
                  team2: team2,
                  type: sportName, // Store the sport type (soccer, tennis, cricket),
                  runners:runners,
                }
                
              );
      
                console.log("new match", newMatch);
                try {
                  await newMatch.save();
                  console.log(match.name + " is Saved");
                } catch (err) {
                  console.log(err);
                }
              } else {
                // console.log(isMatchOld);
                console.log(match.name + " is Already Present");
              }
            }
          }
        }
      }
      // return res.status(200).json({ status: 1, dataobj: AllMatches });
      // return res.status(200).json({ status: 1, dataobj: response.data });
    } catch (err) {
      console.log('I am here',err);
      //return res.status(400).json("API FAILED");
    }
};


const updateMatchRunners = async (req, res) => {
  try {
    // Fetch all matches from the database
    const matches = await Match.find({});
    
    for (const match of matches) {
      try {
        // Fetch runners data from the external API using the match ID
        const marketListResponse = await axios.get(
          "http://172.105.54.97:8085/api/new/geMarketsList",
          {
            params: {
              EventID: match.match_id,
            },
          }
        );

        let runnersData;
        if (Array.isArray(marketListResponse.data)) {
          const matchOddsMarket = marketListResponse.data.find(
            (item) => item.marketName === "Match Odds"
          );

          if (matchOddsMarket) {
            const runnersResponse = await axios.get(
              "http://172.105.54.97:8085/api/new/geRunners",
              {
                params: {
                  MarketID: matchOddsMarket.marketId,
                },
              }
            );

            runnersData = runnersResponse.data[0]?.runners || [];
          }
        }

        // If runners data is found, update the match
        if (runnersData) {
          match.runners = runnersData;
          await match.save();
          console.log(`Updated runners for match: ${match.match_name}`);
        } else {
          console.log(`No runners found for match: ${match.match_name}`);
        }
      } catch (err) {
        console.error(`Error fetching/updating runners for match ID ${match.match_id}:`, err);
      }
    }

    res.status(200).json({
      status: 1,
      message: "Matches updated successfully with runners data",
    });
  } catch (err) {
    console.error("Error updating matches with runners:", err);
    res.status(500).json({
      status: 0,
      message: "Failed to update matches with runners",
      error: err.message,
    });
  }
};
module.exports = {
  getData,
  getSeriesList,
  bookMakerMarket,
  diamondFancy,
  getAllMatchesList,
  getRunners,
  getMarketList,
  getOdds,
  getScore,
  getFancyResult,
  getLiveTVURL,
  fancyDeclartion,
  saveMatchesCricket,
  updateMatchRunners
};
