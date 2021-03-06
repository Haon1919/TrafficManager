var moment = require("moment");

exports.checkParams = (keys, obj) => {
  for (let key of keys) {
    if (obj[[key]] === undefined) return false;
  }
  return true;
};

exports.clearOldMessages = db => {
  let now = moment();

  db.get()
    .collection("AIS")
    .find({})
    .toArray((err, messages) => {
      if (err) throw error;
    
      messages.forEach((message) => {
        if (moment(message.Timestamp).isBefore(now.subtract(30, "seconds"))) {
          db.get().collection("AIS").deleteOne({ MMSI: messages.MMSI });
        }
      });
    });
};
