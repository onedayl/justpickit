// Dependencies
const fs = require('fs');
const path = require('path');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');


// Export Modules
const index = express.Router();

index.get('/', (req, res) => {
  const settings = res.locals.settings;
  const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;
  const sources = settings.sources;

  MongoClient.connect(dbUrl, (err, db) => {
    assert.equal(err, null, 'Connect database fails!');
    const nums = [];
    let count = 0;
    const sourcesLength = sources.length;

    sources.forEach((ele, index) => {
      const name = sources[index];
      let query = {};
      
      if (index === 0) {
        query = {isFree: true};
      } else {
        query = {
          playInfo: {
            $elemMatch: {
              $and: [{
                source: name
                }, {
                price: {
                  $ne: 0
                }
              }]
            }
          }
        };
      }

      db.collection('movieWish')
        .find(query)
        .count((err, num) => {
          assert.equal(err, null, `count fails: ${sources}`);
          nums[index] = {
            name: name,
            num: num 
          };
          count += 1;

          if (count == sourcesLength) {
            res.render('index', {ret: nums})
          }
        });
    });
  });
});


module.exports = index;
