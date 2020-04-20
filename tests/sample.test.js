// tests/product.test.js

const mongoose = require("mongoose");

const dbHandler = require("./db-handler");

const request = require("supertest");

const server = require("../bin/www");

describe("Traffic Manager", () => {
  beforeAll(async () => await dbHandler.connect());

  afterEach(async () => await dbHandler.clearDatabase());

  afterAll(async () => await dbHandler.closeDatabase());

  it("Works!", async () => {
    const aisMock = "hello";
    let res = await request(server)
      .post("/TrafficService/now")
      .send(aisMock)
      .set("Accept", "application/json");
  });

  it("Fetches ais messages", async() => {
    let res = await request(server).get("/AIS/fetch-latest");
    console.log(res);
  })
});
