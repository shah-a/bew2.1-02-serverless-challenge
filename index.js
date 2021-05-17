const serverless = require('serverless-http');
const express = require('express');
const AWS = require('aws-sdk');

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;

let dynamoDb;
if (process.env.IS_OFFLINE) {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
  // console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
}

app.use(express.json({ strict: false }));

app.get('/', (req, res) => {
  res.send("Salaam, world! :)");
});

app.get('/users/:userId', (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId
    }
  };

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      return res.status(400).json({ error: "Could not get user" });
    }
    if (result.Item) {
      const { userId, name } = result.Item;
      return res.json({ userId, name });
    }
    return res.status(404).json({ error: "User not found" });
  });
});

app.post('/users', (req, res) => {
  const { userId, name } = req.body;
  if (typeof userId !== 'string' || typeof name !== 'string') {
    return res.status(400).json({ error: "\"userId\" and \"name\" must both be strings" })
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId,
      name
    }
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      return res.status(400).json({ error: "Could not add user" });
    }
    return res.json({ userId, name });
  });
});

module.exports.handler = serverless(app);
