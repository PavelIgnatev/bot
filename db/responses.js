const { MongoClient } = require("mongodb");

const dbName = "telegram";
const collectionName = "responses";
const uri =
  "mongodb://qwerty:qwerty123@ac-llvczxo-shard-00-00.2ry9k50.mongodb.net:27017,ac-llvczxo-shard-00-01.2ry9k50.mongodb.net:27017,ac-llvczxo-shard-00-02.2ry9k50.mongodb.net:27017/?ssl=true&replicaSet=atlas-b2xf0l-shard-0&authSource=admin&retryWrites=true&w=majority";

class ResponsesService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;

    this.connect = this.connect.bind(this);
    this.postResponse = this.postResponse.bind(this);
    this.getResponse = this.getResponse.bind(this);
    this.getAllResponses = this.getAllResponses.bind(this);
  }

  async connect() {
    if (this.client) {
      return;
    }

    this.client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.db = this.client.db(dbName);
    this.collection = this.db.collection(collectionName);
  }

  async postResponse(response) {
    await this.connect();

    await this.collection.updateOne(
      { username: response.username },
      { $set: response },
      { upsert: true }
    );
  }

  async getResponse(username) {
    await this.connect();
    return await this.collection.findOne({ username });
  }

  async getAllResponses() {
    await this.connect();
    return await this.collection.find().toArray();
  }
}

module.exports = new ResponsesService();
