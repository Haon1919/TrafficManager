var MongoClient = require("mongodb").MongoClient;

var state = {
  db: null,
};

exports.connect = function (url) {
  return new Promise((res, rej) => {
    if (state.db) {
      state.db.close(function (err) {
        if (err) {
          rej("Unable to connect to Mongo.");
        }
        state.db = null;
        state.mode = null;
      });
    }

    MongoClient.connect(url, { useUnifiedTopology: true }, function (
      err,
      client
    ) {
      if (err) {
        rej("Unable to connect to Mongo.");
      }
      state.db = client.db();
      res();
    });
  });
};

exports.get = function () {
  return state.db;
};

exports.clearDatabase = function () {
  state.db.listCollections().toArray(function (err, collections) {
    if (err) {
      console.log("Unable to clear database");
      process.exit(1);
    }

    collections.forEach((collection) => {
      state.db.collection(collection.name).deleteMany();
    });
  });
};

exports.close = function () {
  if (state.db) {
    state.db.close(function (err, result) {
      if (err) console.log(err);
      state.db = null;
      state.mode = null;
    });
  }
};
