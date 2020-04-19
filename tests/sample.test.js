var mongoose = require('mongoose');
var server = require('../bin/www');
var request = require('supertest');

describe("Traffic Manager", () => {
  beforeAll(async () => {
    await mongoose.connect(
      'mongodb://localhost:27017',
      { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
      (err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
      }
    );
  });

  it("handles requests successfully", async () => {
    let response = await request(server).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("It works!");
  });

  it("stores valid AIS messages", () => {
    const mockAisMessage = {

    };
  });

  it("returns error for invalid AIS messages", () => {
    const invalidAisMessage = {

    }

  });

  it("only stores messages for valid vessels", () => {
    const invalidVesselName = "";
  });

  it("returns valid enterance/departure info for a ship by MMSI", () => {
    
  });

  it("returns error for enterance/departure endpoint if it cannot find info for MMSI", () => {});

  it("logs valid enterancedeparture information", () => {});

  afterAll(async () => {
    await mongoose.connection.close();
  });
});
