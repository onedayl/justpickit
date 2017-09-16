// Dependencies
const fs = require('fs');
const path = require('path');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// settings
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));

// Export Modules
const list = express.Router();

list.get('/', (req, res) => {
  res.sourceId = req.query.source && req.query.source <= 7 ? req.query.source : '0';
  res.format = req.query.format ? req.query.format : 'html';
  res.skip = req.query.skip ? parseInt(req.query.skip) : 0;
  res.limit = req.query.limit && req.query.limit <= 30 ? parseInt(req.query.limit) : 10;

  const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;
  const sources = settings.sources;

  MongoClient.connect(dbUrl, (err, db) => {
    assert.equal(err, null, 'Connect database fails!');
    let query = {};

    if (res.sourceId == '0') {
      query = {isFree: true};
    } else {
      const name = sources[res.sourceId];
      query = {playInfo: {$elemMatch: {$and: [{source: name}, {price: {$ne: 0}}]}}};
    }

    const cursor = db.collection('movieWish').find(query).sort({_id: -1});
    cursor.skip(res.skip).limit(res.limit).toArray((err, arr) => {
      if (res.format == 'json') {
        res.send(JSON.stringify(arr));
      } else {
        res.render('list', {cards: arr});
      }
    });
  });
});

module.exports = list;
