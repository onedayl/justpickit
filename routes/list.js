// Dependencies
const fs = require('fs');
const express = require('express');
const superagent = require('superagent');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Export Modules
const list = express.Router();

list.get('/', (req, res) => {
  const format  = req.query.format || 'html';
  const search = req._parsedOriginalUrl.search || '';
  const host = req.headers.host || 'jpi.onedayl.com';
  const url = search == '' ? `${host}/data` : `${host}/data${search}`;

  superagent
  .get(url)
  .end((err, chunk) => {
    if (err == null) {
      const content = JSON.parse(chunk.text);

      if (format == 'json') {
        res.end(chunk.text);

      } else {
        res.render('list', {
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
      }

    } else {
      console.log(err.Error);
      res.render('list', {ret: {flag: 0}});
    }
  });
});

module.exports = list;
