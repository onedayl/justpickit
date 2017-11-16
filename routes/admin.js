// Dependencies
const fs = require('fs');
const path = require('path');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;

// Export Modules
const admin = express.Router();

admin.get('/', (req, res) => {
  if (req.session) {
    const reqUsername = req.session.username;
    const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));
    const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;

    if (reqUsername == settings.user.username) {
      MongoClient.connect(dbUrl, (err, db) => {
        if (!err) {
          const title = req.query.title == undefined ? '' : req.query.title.trim();
          const isFree = req.query.is_free || 1;
          const source = req.query.source || 1;
          const sortId = req.query.sort || 1;

          const query = {};
          const sort = {};

          if (title) {
            const regex = new RegExp(`${title}`);
            query.title = {$regex: regex};
          }

          if (isFree == 2) {
            query.isFree = true;
          } else if (isFree == 3) {
            query.isFree = false;
          }

          if (source != 1) {
              query.playInfo = {$elemMatch: {sourceId: parseInt(source) - 1}};
          }

          if (sortId == 1) {
            sort._id = -1;
          } else {
            sort.rating = -1;
          }


          const p = req.query.p || 1;
          const skip = ( p - 1) * 5;
          const cursor = db.collection('movieWish').find(query);

          cursor.count((err, total) => {
            cursor.sort(sort).skip(skip).limit(5).toArray((err, docs) => {
              if (!err) {
                res.render('admin', {
                  ret: {
                    flag: 1,
                    data: docs,
                    p: p,
                    total: Math.ceil(total / 5),
                    query: {
                      title: title,
                      is_free: isFree,
                      source: source,
                      sort: sortId
                    }
                  }
                });
              }
            })
          });
        } else {
          res.render('admin', {ret: {flag: 0}});
        }
      });
    } else {
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
});

module.exports = admin;
