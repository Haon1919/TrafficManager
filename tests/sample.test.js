var db = require("../db");

const request = require("supertest");

const server = require("../bin/www");

const testAISmessages = [
  {
    Class: "Class A",
    ICES_Rect: 4421,
    MMSI: 219385000,
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
  },
  {
    Class: "Class A",
    ETA: "2019-08-26T18:41:00.000Z",
    ICES_Rect: 4421,
    MMSI: 219385000,
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

const invalidIMO = "12345";

const invalidMMSI = "12345";

describe("Traffic Manager", () => {
  beforeAll(async () => {
    try {
      await db.connect("mongodb://localhost:27017/Test")
    } catch(err) {
      console.log(err);
      process.exit(1);
    }
  });

  afterEach(async () => db.clearDatabase());

  afterAll(async () => db.close());

  it("Successfully handles an AIS request", async () => {
    let res = await request(server)
      .post("/TrafficService/now")
      .send(testAISmessages[0]);

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(testAISmessages[0].MMSI);
    expect(res.body.StaticData.Name).toBe(testAISmessages[0].StaticData.Name);
  });

  it("Retrieves AIS messages by MMSI", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages[0]);

    let res = await request(server).get(
      `/AIS/fetch-latest/${testAISmessages[0].MMSI}`
    );

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(testAISmessages[0].MMSI);
    expect(res.body.StaticData.Name).toBe(testAISmessages[0].StaticData.Name);
  });

  it("Retrieves the latest AIS messages when querying by MMSI", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages[0]);
    await request(server).post("/TrafficService/now").send(testAISmessages[1]);

    let res = await request(server).get(
      `/AIS/fetch-latest/${testAISmessages[1].MMSI}`
    );

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(testAISmessages[1].MMSI);
    expect(res.body.StaticData.Name).toBe(testAISmessages[1].StaticData.Name);
  });

  it("Returns a list of AIS messages when querying for a list for a given MMSI", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages[0]);
    await request(server).post("/TrafficService/now").send(testAISmessages[1]);

    let res = await request(server).get(`/AIS/list/${testAISmessages[0].MMSI}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  //MMSI was used in this case but this test covers querying by IMO as well
  it("Returns a 404 when querying by an identification that has no AIS messages associated with it", async () => {
    let res = await request(server).get(`/AIS/fetch-latest/${invalidMMSI}`);
    expect(res.status).toBe(404);
  });

  it("Retrieves AIS messages by IMO", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages[0]);

    let res = await request(server).get(
      `/AIS/fetch-latest/${testAISmessages[0].StaticData.IMO}`
    );

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(testAISmessages[0].MMSI);
    expect(res.body.StaticData.IMO).toBe(testAISmessages[0].StaticData.IMO);
    expect(res.body.StaticData.Name).toBe(testAISmessages[0].StaticData.Name);
  });

  it("Retrieves the latest AIS messages when querying by IMO", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages[0]);
    await request(server).post("/TrafficService/now").send(testAISmessages[1]);

    let res = await request(server).get(
      `/AIS/fetch-latest/${testAISmessages[0].StaticData.IMO}`
    );

    expect(res.status).toBe(200);
    expect(res.body.MMSI).toBe(testAISmessages[1].MMSI);
    expect(res.body.StaticData.IMO).toBe(testAISmessages[1].StaticData.IMO);
    expect(res.body.StaticData.Name).toBe(testAISmessages[1].StaticData.Name);
  });

  it("Returns a list of AIS messages when querying for a list for a given IMO", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages[0]);
    await request(server).post("/TrafficService/now").send(testAISmessages[1]);

    let res = await request(server).get(`/AIS/list/${testAISmessages[0].StaticData.IMO}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
  
  //IMO was used in this case but this test covers querying by MMSI as well
  it("Returns a 404 when of when querying for a list for a given IMO that has no AIS messages associated with it", async () => {
    await request(server).post("/TrafficService/now").send(testAISmessages[0]);
    await request(server).post("/TrafficService/now").send(testAISmessages[1]);

    let res = await request(server).get(`/AIS/list/${invalidIMO}`);
    expect(res.status).toBe(404);
  });

  //implement when AIS statistics works
  it("Returns AIS statistics", () => {});
});
