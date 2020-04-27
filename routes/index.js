var express = require("express");
var router = express.Router();
var db = require("../db");
var helper = require("../helper");

router.post("/enterance-departure", (req, res) => {
  if (
    !helper.checkParams(["destination", "MMSI", "IMO"], req.body)
  ) {
    res.status(400).send("Malformed request.");
  }

  db.get()
    .listCollections({ name: "EnteranceDepartureData" })
    .toArray(function (err, items) {
      if (err) {
        return res.status(500).send(err);
      }
      //Account for if there is more than one collection
      if (items.length !== 1)
        db.get().createCollection("EnteranceDepartureData");
    });

  try {
    db.get().collection("EnteranceDepartureData").insertOne(req.body);
  } catch (e) {
    return res.status(500).send("Error inserting data.");
  }

  res.send(req.body);
});

router.get("/enterance-departure/:identification", (req, res) => {
  let identification = parseInt(req.params.identification);

  db.get()
    .collection("EnteranceDepartureData")
    .find({
      $or: [{ MMSI: identification }, { IMO: identification }],
    })
    .limit(1)
    .sort({ $natural: 1 })
    .toArray(function (err, messageList) {
      if (err) {
        return res.status(500).send(err);
      }

      if(messageList.length === 0) {
        return res.status(404).send(`No messages found with MMSI or IMO of ${identification}`);
      }

      res.send(messageList[0]);
    });
});

router.get("/ais-statistics", (req, res) => {
  db.get().collection("AIS").find().toArray(function(err, messageList) {
    if(err) throw err;

    if(messageList.length === 0) {
      return res.status(404).send("No AIS statistics could be calculated because there are currently no AIS messages in the system");
    }

    let statistics = {
      destinations: [],
      averageSOG: 0,
      totalMoored: 0,
      totalUnderway: 0,
      vesselTypeCount: {},
      totalVessels: 0
    }

    let totalSOG = 0;

    messageList.forEach(item =>{  
      if(item.StaticData.Destination !== undefined && !statistics.destinations.includes(item.StaticData.Destination)) {
        statistics.destinations.push(item.StaticData.Destination)
      }

      if(Object.keys(statistics.vesselTypeCount).includes(item.StaticData.VesselType)) {
        statistics.vesselTypeCount[[item.StaticData.VesselType]] += 1
      } else {
        statistics.vesselTypeCount[[item.StaticData.VesselType]] = 1;
      }

      if(item.PositionReport.NavigationalStatus === "Moored") {
        statistics.totalMoored += 1;
      } else {
        statistics.totalUnderway += 1;
      }

      totalSOG += item.PositionReport.SoG;
    });

    statistics.averageSOG = totalSOG / messageList.length;

    statistics.totalVessels = messageList.length;

    res.header("Access-Control-Allow-Origin", "http://localhost:8080");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin,Content-Type, Authorization, x-id, Content-Length, X-Requested-With"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );

    res.send(statistics);
  })
});

router.post("/TrafficService/:timestamp", (req, res) => {
  let messages = req.body;

  if (messages !== undefined && messages !== null) {
    db.get()
      .listCollections({ name: "AIS" })
      .toArray(function (err, items) {
        if (err) {
          return res.status(500).send(err);
        }
        if (!items.length) {
          db.get().createCollection("AIS");
          db.get()
            .collection("AIS")
            .insertMany(messages, function (err, queryRes) {
              if (err) throw err;
              res.send(queryRes.ops);
            });
        } else {
          messages.forEach((message) => {
            delete message._id;
            try {
              db.get()
                .collection("AIS")
                .replaceOne({ MMSI: message.MMSI }, message, { upsert: true });
            } catch (e) {
              return res.status(500).send(e);
            }
          });
          res.send(messages);
        }
      });
    helper.clearOldMessages(db);
  }
});

router.get("/AIS/fetch-latest/:identification", (req, res) => {
  let identification = parseInt(req.params.identification);

  db.get()
    .collection("AIS")
    .find({
      $or: [{ MMSI: identification }, { "StaticData.IMO": identification }],
    })
    .limit(1)
    .sort({ $natural: -1 })
    .toArray(function (err, messageList) {
      if (err) {
        return res.status(500).send(err);
      }

      if (messageList.length === 0) {
        res
          .status(404)
          .send(
            `No AIS messages assosiated with an MMSI or IMO of ${identification}`
          );
      } else {
        res.send(messageList[0]);
      }
    });
});

router.get("/AIS/list", (_, res) => {
  db.get()
    .collection("AIS")
    .find({})
    .toArray(function (err, messageList) {
      if (err) {
        return res.status(500).send(err);
      }

      if (messageList.length === 0) {
        return res.status(404).send("No AIS messages are currently available.");
      }

      messageList.forEach((mes) =>
        mes.PositionReport.Position.coordinates.reverse()
      );
      helper.clearOldMessages(db);
      res.header("Access-Control-Allow-Origin", "http://localhost:8080");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin,Content-Type, Authorization, x-id, Content-Length, X-Requested-With"
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.send(messageList);
    });
});

module.exports = router;
