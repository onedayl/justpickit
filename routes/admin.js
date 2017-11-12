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
          const p = req.query.p || 1;
          const skip = ( p - 1) * 5;
          const total = db.collection('movieWish').find().count((err, total) => {
            const cursor = db.collection('movieWish').find().sort({"_id": -1}).skip(skip).limit(5);
            cursor.toArray((err, docs) => {
              if (!err) {
                res.render('admin', {ret: {flag: 1, data: docs, p: p, total: Math.ceil(total / 5)}});
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
