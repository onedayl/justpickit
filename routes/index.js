// Dependencies
const fs = require('fs');
const path = require('path');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// settings
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));

// Export Modules
const index = express.Router();

index.get('/', (req, res) => {
  res.format = req.query.format;
  const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;
  const sources = settings.sources;

  MongoClient.connect(dbUrl, (err, db) => {
    assert.equal(err, null, 'Connect database fails!');
    const counts = [];
    let index = -1;

    countSource(sources, index, counts, db, res);
  });
});

function countSource(sources, index, counts, db, res) {
  if (index < sources.length - 1) {
    index += 1;
    const name = sources[index];
    let query = {};

    if (index === 0) {
      query = {isFree: true};
    } else {
      query = {playInfo: {$elemMatch: {$and: [{source: name}, {price: { $ne: 0}}]}}};
    }

    db.collection('movieWish')
    .find(query)
    .count((err, num) => {
      assert.equal(err, null, `count fails: ${sources}`);
      counts.push(num);
      countSource(sources, index, counts, db, res);
    });

  } else {
    const countResult = counts.map((count, index) => {
      return {
        "name": sources[index],
        "count": count
      }
    });

    db.close();
    if (res.format) {
      res.send(countResult);
    } else {
      res.render('index', {sources: countResult});
    }
  }
}

module.exports = index;
