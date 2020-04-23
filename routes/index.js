var express = require("express");
var router = express.Router();
var db = require("../db");
var helper = require("../helper");

//TODO: Create post route that logs ais data it recieves
///TrafficService/2018-09-11T10:39:05.000Z
//TODO: Create get that fetches AIS informathion based on ship identification
//TODO: Upload enterence and departure information
//TODO: only vessels that send messages from a class A AIS transceiver, i.e. only the larger, commercial ships on an international voyage are to be monitored
//TODO: production of AIS statistics

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send("It works!");
});

router.post("/enterance-departure/:MMSI", function (req, res) {
  let MMSI = req.params.MMSI;

  if (!helper.checkParams(["ETD", "ETA"], req.body)) {
    res.status(400).send("Malformed request.");
  }

  db.get()
    .listCollections({ name: "EnteranceDepartureData" })
    .toArray(function (err, items) {
      if (err) throw err;
      //Account for if there is more than one collection
      if (items.length !== 1)
        db.get().createCollection("EnteranceDepartureData");
    });

  req.body["MMSI"] = MMSI;
  db.get().collection("EnteranceDepartureData").insertOne(req.body);

  res.send(req.body);
});

router.get("/enterance-departure/:identification", function (req, res) {
  let identification = req.params.identification;
  //TODO: Add nested query
  db.get()
    .collection("AIS")
    .find({ $or: [{ MMSI: identification }, { IMO: identification }] })
    .limit(1)
    .sort({ $natural: 1 })
    .toArray(function (messageList, err) {
      if (err) throw err;
      res.json(messageList[0]);
    });
});

router.get("/ais-statistics", function (req, res) {
  // db.get().collection("AIS").find().toArray(function(err, messageList) {
  //   if(err) throw err;
  //   let statistics = {}
  //   messageList.forEach(function(item, i)
  // })
});

router.post("/TrafficService/:timestamp", function (req, res) {
  let message = req.body;

  if (message !== undefined && message !== null) {
    delete message._id;

    db.get()
      .listCollections({ name: "AIS" })
      .toArray(function (err, items) {
        if (err) throw err;
        //Account for if there is more than one collection
        if (items.length !== 1) db.get().createCollection("AIS");
      });

    db.get()
      .collection("AIS")
      .insertOne(message, function (err, queryRes) {
        if (err) throw err;
        res.send(queryRes.ops[0]);
      });
  }
});

router.get("/AIS/fetch-latest/:identification", function (req, res) {
  let identification = parseInt(req.params.identification);

  db.get()
    .collection("AIS")
    .find({
      $or: [{ MMSI: identification }, { "StaticData.IMO": identification }],
    })
    .limit(1)
    .sort({ $natural: -1 })
    .toArray(function (err, messageList) {
      if (err) throw err;

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

router.get("/AIS/list/:identification", function (req, res) {
  let identification = parseInt(req.params.identification);

  db.get()
    .collection("AIS")
    .find({
      $or: [{ MMSI: identification }, { "StaticData.IMO": identification }],
    })
    .toArray(function (err, messageList) {
      if (err) throw err;

      if (messageList.length === 0) {
        res
          .status(404)
          .send(
            `No AIS messages assosiated with an MMSI or IMO of ${identification}`
          );
      } else {
        res.send(messageList);
      }
    });
});

module.exports = router;
