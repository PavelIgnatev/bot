const { MongoClient } = require("mongodb");

const dbName = "telegram";
const collectionName = "dialogues";
const uri =
  "mongodb://qwerty:qwerty123@ac-llvczxo-shard-00-00.2ry9k50.mongodb.net:27017,ac-llvczxo-shard-00-01.2ry9k50.mongodb.net:27017,ac-llvczxo-shard-00-02.2ry9k50.mongodb.net:27017/?ssl=true&replicaSet=atlas-b2xf0l-shard-0&authSource=admin&retryWrites=true&w=majority";

class DialoguesService {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;

    this.connect = this.connect.bind(this);

    this.postDialogue = this.postDialogue.bind(this);
    this.postDialogueNew = this.postDialogueNew.bind(this);
    this.getDialogue = this.getDialogue.bind(this);
    this.getUsernamesByGroupId = this.getUsernamesByGroupId.bind(this);
    this.getDialogues = this.getDialogues.bind(this);
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

  async postDialogue(dialogue) {
    await this.connect();

    await this.collection.updateOne(
      { username: dialogue.username, aiUsername: dialogue.aiUsername },
      { $set: dialogue },
      { upsert: true }
    );
  }

  async postDialogueNew(dialogue) {
    await this.connect();

    await this.collection.updateOne(
      { accountId: dialogue.accountId, href: dialogue.href },
      { $set: dialogue },
      { upsert: true }
    );
  }

  // получание по
  async getDialogue(username, aiUsername) {
    await this.connect();
    return await this.collection.findOne({ username, aiUsername });
  }

  async getDialogueGroupId(username, groupId) {
    await this.connect();
    return await this.collection.findOne({ username, groupId });
  }

  async getDialogues(groupId) {
    await this.connect();

    return await this.collection.find({ groupId }).toArray();
  }

  // все пользователи, которым была отправка по конкретному groupId
  async getUsernamesByGroupId(groupId) {
    await this.connect();

    const dialogues = await this.collection.find({ groupId }).toArray();
    return dialogues.map((dialogue) => dialogue.username);
  }
}

module.exports = new DialoguesService();
