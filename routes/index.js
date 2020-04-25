var express = require("express");
var router = express.Router();
var db = require("../db");
var helper = require("../helper");

router.post("/enterance-departure/:MMSI", (req, res) => {
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

router.get("/enterance-departure/:identification", (req, res) => {
  let identification = req.params.identification;
  db.get()
    .collection("AIS")
    .find({ $or: [{ MMSI: identification }, {"StaticData.IMO" : identification }] })
    .limit(1)
    .sort({ $natural: 1 })
    .toArray(function (messageList, err) {
      if (err) throw err;
      res.json(messageList[0]);
    });
});

router.get("/ais-statistics", (req, res) => {
  // db.get().collection("AIS").find().toArray(function(err, messageList) {
  //   if(err) throw err;
  //   let statistics = {}
  //   messageList.forEach(function(item, i)
  // })
});

router.post("/TrafficService/:timestamp",  (req, res) => {
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
      .insertMany(message, function (err, queryRes) {
        if (err) throw err;
        res.send(queryRes.ops);
      });
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

router.get("/AIS/list/:identification", (req, res) => {
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
