var db = require("../db");

var moment = require("moment");

const request = require("supertest");

const server = require("../bin/www");


const testAISmessages = [
  {
    Class: "Class A",
    ICES_Rect: 4421,
    MMSI: 219385000,
    ETA : "2018-09-13T13:00:00.000Z",
    PositionReport: {
      CoG: 80.3,
      NavigationalStatus: "Under way using engine",
      Position: {
        coordinates: [12.59301, 55.679272],
        type: "Point",
      },
      SoG: 0,
    },
    StaticData: {
      A: 10,
      B: 20,
      Breadth: 6,
      C: 3,
      CallSign: "OXXM",
      D: 3,
      DataSourceType: "AIS",
      Destination: "COPENHAGEN",
      IMO: 5161158,
      Length: 30,
      Name: "TESTAISMESSAGE",
      PositionFixingDevice: "GPS",
      VesselType: "Passenger",
    },
    Timestamp: "2018-09-11T10:38:14.000Z",
  },
  {
    Class: "Class A",
    ETA: "2019-08-26T18:41:00.000Z",
    ICES_Rect: 4421,
    MMSI: 219385001,
    PositionReport: {
      CoG: 12.8,
      Heading: 276,
      NavigationalStatus: "Under way using engine",
      Position: {
        coordinates: [12.501658, 55.610765],
        type: "Point",
      },
      RoT: 0,
      SoG: 0,
    },
    StaticData: {
      A: 53,
      B: 10,
      Breadth: 9,
      C: 4,
      CallSign: "OXGA",
      D: 5,
      DataSourceType: "AIS",
      Destination: "FAKSE BUGT",
      IMO: 5161158,
      Length: 63,
      Name: "ARGONAUT",
      PositionFixingDevice: "GPS",
      VesselType: "Dredging",
    },
    Timestamp: "2018-09-11T10:38:14.000Z",
  },
];

const entDepartInfo = {
  ETA: testAISmessages[0].ETA,
  ETD: testAISmessages[0].ETD,
  destination: testAISmessages[0].StaticData.Destination,
  MMSI: testAISmessages[0].MMSI,
  IMO: testAISmessages[0].StaticData.IMO
}

const invalidIMO = "12345";

const invalidMMSI = "12345";

describe("Traffic Manager", () => {
  beforeAll(async () => {
    try {
      await db.connect("mongodb://localhost:27017/Test");
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  });

 afterEach(async () => db.clearDatabase());

  afterAll(async () => db.close());

  it("Handles AIS logging messages successfully", async () => {
    let res = await request(server)
      .post("/TrafficService/now")
      .send(testAISmessages);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("Retrieves list of AIS messages", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages);
    let res = await request(server).get("/AIS/list");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });


  it("Updates AIS message if one with the same identification exists in the databse", async () => {
     await request(server)
    .post("/TrafficService/now")
    .send([testAISmessages[0]]);

     await request(server)
    .post("/TrafficService/now")
    .send([testAISmessages[0]]);

    let res = await request(server).get("/AIS/list");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it("Handles enterance/departure information", async () => {
    let res = await request(server).post("/enterance-departure").send(entDepartInfo);

    expect(res.status).toBe(200);
    expect(res.body.ETA).toBe(entDepartInfo.ETA);
    expect(res.body.ETD).toBe(entDepartInfo.ETD);
    expect(res.body.destination).toBe(entDepartInfo.destination);
    expect(res.body.MMSI).toBe(entDepartInfo.MMSI);
    expect(res.body.IMO).toBe(entDepartInfo.IMO);
  });

  it("Retrieves enterance/departure information by MMSI", async () => {
    await request(server).post("/enterance-departure").send(entDepartInfo);

    let res = await request(server).get(`/enterance-departure/${entDepartInfo.MMSI}`);

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(entDepartInfo.MMSI);
  });

  it("Retrieves enterance/departure information by IMO", async () => {
    await request(server).post("/enterance-departure").send(entDepartInfo);

    let res = await request(server).get(`/enterance-departure/${entDepartInfo.IMO}`);
    expect(res.status).toBe(200);
    expect(res.body.IMO).toBe(entDepartInfo.IMO);
  });

  it("Returns a 404 when querying for enterance/departure information by nonexistant MMSI", async () => {
    let res = await request(server).get(`/enterance-departure/${invalidMMSI}`);
    expect(res.status).toBe(404);
  });

  it("Returns a 404 when querying for enterance/departure information by nonexistant IMO", async () => {
    let res = await request(server).get(`/enterance-departure/${invalidMMSI}`);
    expect(res.status).toBe(404);
  });

  it("Retrieves AIS messages by MMSI", async () => {
    await request(server)
      .post("/TrafficService/now")
      .send([testAISmessages[0]]);

    let res = await request(server).get(
      `/AIS/fetch-latest/${testAISmessages[0].MMSI}`
    );

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(testAISmessages[0].MMSI);
    expect(res.body.StaticData.Name).toBe(testAISmessages[0].StaticData.Name);
  });

  it("Retrieves AIS message when querying by IMO", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages);

    let res = await request(server).get(
      `/AIS/fetch-latest/${testAISmessages[0].StaticData.IMO}`
    );

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(testAISmessages[1].MMSI);
    expect(res.body.StaticData.IMO).toBe(testAISmessages[1].StaticData.IMO);
    expect(res.body.StaticData.Name).toBe(testAISmessages[1].StaticData.Name);
  });

  //MMSI was used in this case but this test covers querying by IMO as well
  it("Returns a 404 when querying by an MMSI that has no AIS messages associated with it", async () => {
    let res = await request(server).get(`/AIS/fetch-latest/${invalidMMSI}`);
    expect(res.status).toBe(404);
  });

  it("Returns a 404 when querying by an IMO that has no AIS messages associated with it", async () => {
    let res = await request(server).get(`/AIS/fetch-latest/${invalidIMO}`);
    expect(res.status).toBe(404);
  });

  it("Returns AIS statistics", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages);

    let res = await request(server).get("/ais-statistics");

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).includes("destinations")).toBe(true);
    expect(Object.keys(res.body).includes("averageSOG")).toBe(true);
    expect(Object.keys(res.body).includes("totalMoored")).toBe(true);
    expect(Object.keys(res.body).includes("totalUnderway")).toBe(true);
    expect(Object.keys(res.body).includes("vesselTypeCount")).toBe(true);
    expect(Object.keys(res.body).includes("totalVessels")).toBe(true);
  });
});
