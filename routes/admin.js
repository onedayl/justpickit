// Dependencies
const fs = require('fs');
const express = require('express');
const superagent = require('superagent');
const MongoClient = require('mongodb').MongoClient;

// Export Modules
const admin = express.Router();

admin.get('/', (req, res) => {

  if (req.session) {
    const reqUsername = req.session.username;

    if (reqUsername == res.locals.settings.user.username) {
      const search = req._parsedOriginalUrl.search || '';
      const host = req.headers.host || 'jpi.onedayl.com'
      const url = search == '' ? `${host}/data` : `${host}/data${search}`;

      superagent
        .get(url)
        .end((err, chunk) => {
          if (err == null) {
            const content = JSON.parse(chunk.text);
            res.render('admin', {
              ret: {
                flag: 1,
                data: content.data,
                p: content.p,
                total: Math.ceil(content.total / 5),
                query: {
                  title: content.title,
                  is_free: content.is_free,
                  source: content.source,
                  sort: content.sort
                }
              }
            });
          } else {
            console.log(err.Error);
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
