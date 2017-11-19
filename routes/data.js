// Dependencies
const fs = require('fs');
const path = require('path');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const superagent = require('superagent');
const cheerio = require('cheerio');
const assert = require('assert');

// Export Modules
const data = express.Router();

// Options
const reForSid = /list(\d+)/;
const reForNumber = /(\d+)/;

data.get('/', (req, res) => {
  const settings = res.locals.settings;
  sourcesSetting = settings.sources;
  const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;

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
            res.end(JSON.stringify({
              flag: 1,
              msg: 'Request successed.',
              p: p,
              data: docs,
              total: total,
              title: title,
              is_free: isFree,
              source: source,
              sort: sortId
            }));
          } else {
            res.end(JSON.stringify({
              flag: 0,
              msg: 'Cursor error.',
            }));
          }
        })
      });
    } else {
      res.end(JSON.stringify({
        flag: 0,
        msg: 'Connect database fails.',
      }));
    }
  });
});


data.put('/wish', (req, res) => {
  res.locals.collectionName = 'movieWish';
  res.locals.type = 0;
  findLastDate(res);
});


data.delete('/collect', (req, res) => {
  res.locals.collectionName = 'movieCollect';
  res.locals.type = 1;
  findLastDate(res);
});


data.use((req, res) => {
  res.end(`You are in the wrong place.`);
});


function findLastDate(res) {
  const settings = res.locals.settings;
  const collectionName = res.locals.collectionName;
  const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;

  MongoClient.connect(dbUrl, (err, db) => {
    assert.equal(err, null, '# Connect Database Fails!');
    console.log('# Start Collecting @ ' + new Date().toLocaleString());

    const cursor = db.collection(collectionName)
      .find()
      .sort({_id: -1})
      .limit(1);

    let lastDate;

    cursor.nextObject((err, obj) => {
      if (!err) {
        lastDate = obj === null ? '1970-01-01' : obj.insertDate;
        console.log('# lastDate: ' + lastDate + '\n');
        db.close();

        res.locals.lastDate = lastDate;
        res.locals.flag = true;
        res.locals.newArr = [];
        res.locals.urlPrefix = res.locals.type === 0 ? settings.url.wish : settings.url.collect;
        const findPagesUrl = res.locals.urlPrefix + '0';

        findPages(findPagesUrl, res);
      }
    });
  })
}


function findPages(url, res) {

  superagent.get(url)
    .end((err, html) => {
      assert.equal(err, null, 'superagent fails!');
      const $ = cheerio.load(html.text);

      const info = $("#db-usr-profile")[0].children[3].children[1].children[0].data;
      const total = parseInt(/\d+/.exec(info)[0]);

      if (total) {
        const pages = Math.ceil(total / 30);
        collectNewItems(pages, 1, res);

      } else {
        res.end('0');
      }
    });
}

function collectNewItems(pages, page, res) {

  if (res.locals.flag && page <= pages) {
    const start = ((page - 1) * 30).toString();
    const url = res.locals.urlPrefix + start;
    console.log('\n\n# Collect from: ' + start + ' @ ' + new Date().toLocaleString());

    superagent.get(url)
      .end((err, html) => {

        assert.equal(err, null, 'superagent fails!');
        const $ = cheerio.load(html.text);

        const sids = $(".item").toArray().map(item => reForNumber.exec(item.attribs.id)[1]);
        const dates = $('.date').toArray().map(date => date.children[0].data.trim() || date.children[2].data.trim());

        if (dates.length !== 0) {
          for (let i = 0; i < dates.length; i++) {
            if (isNewDate(dates[i], res.locals.lastDate)) {

              console.log(`# New: ${sids[i]} | ${dates[i]}`);
              const newItem = {
                "sid": sids[i],
                "insertDate": dates[i]
              };
              res.locals.newArr.push(newItem);

            } else {
              res.locals.flag = false;
              break;
            }
          }
        } else {
          res.locals.flag = false;
        }

        page += 1;
        collectNewItems(pages, page, res);
      });

  } else if (res.locals.newArr.length === 0) {
    console.log('# Total: 0');
    res.end('0');

  } else {
    console.log(`# Total: ${res.locals.newArr.length}`);
    res.end(res.locals.newArr.length.toString());

    if (res.locals.type) {

      // insert new collects into movieCollect collection
      const settings = res.locals.settings;
      const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;
      
      MongoClient.connect(dbUrl, (err, db) => {
        assert.equal(err, null, 'Connect database fails!');
        const insertion = res.locals.newArr.reverse();

        db.collection('movieCollect').insertMany(insertion, {}, (err) => {
          assert.equal(err, null, 'Insert fails!');

          console.log(`# Insert completed!`);
        });


        // delete wish which is in new in collect
        const collectArr = res.locals.newArr.map(i => i.sid);
        const deleteQuery = {sid: {$in: collectArr}};

        db.collection('movieWish').deleteMany(deleteQuery, (err) => {
          if (!err) {
            console.log('Delete wish successed.');

          } else {
            console.log('Delete wish fail.');
          }
        });
      });

    } else {

      let index = -1;
      let newWishesDetails = [];
      const sleepTime = res.locals.newArr.length > 99  ? 36000 : 2000;

      console.log('\n\n# Start Collect Wish Details @ ' + new Date().toLocaleString());
      collectDetails(index, res, newWishesDetails, sleepTime, new Date());
    }
  }
}


function collectDetails(index, res, newWishesDetails, sleepTime, startTime) {

  const newWishes = res.locals.newArr;
  
  if (index < newWishes.length - 1) {
    index += 1;
    const newWish = newWishes[index];
    const url = res.locals.settings.url.details + newWish.sid;
    console.log(`# ${url}`);

    superagent.get(url)
      .end((err, data) => {
        if (err === null) {
          const details = JSON.parse(data.text);

          const fixImages = {};
          fixImages.small = details.images.small.replace(/img3|img7/, 'img1');
          fixImages.medium = details.images.medium.replace(/img3|img7/, 'img1');
          fixImages.large = details.images.large.replace(/img3|img7/, 'img1');

          newWishesDetails.push({
            "sid":        newWish.sid,
            "insertDate": newWish.insertDate,
            "title":      details.title,
            "year":       details.year,
            "rating":     details.rating.average,
            "images":     fixImages,
            "genres":     details.genres,
            "summary":    details.summary
          });

          console.log(`# ${newWish.sid} | ${details.title} | ${index + 1}/${newWishes.length}`);

          if (index + 1 != newWishes.length) {
            console.log(`# Wait ${sleepTime / 1000}s ...`);

            sleep(sleepTime).then(() => {
              collectDetails(index, res, newWishesDetails, sleepTime, startTime);
            });

          } else {
            collectDetails(index, res, newWishesDetails, sleepTime, startTime);
          }

        } else {
          console.log('Fetch douban API error.');
        }
      });

  } else {
    console.log(`# Collect Details Completed: ${elapseTime(startTime, new Date())}`);

    index = -1;
    console.log('\n\n# Start Collect Subject @ ' + new Date().toLocaleString());

    collectSubject(res, index, newWishesDetails, new Date(), res);
  }
}


function collectSubject(res, index, newWishesDetails, startTime, res) {

  if (index < newWishesDetails.length - 1) {
    index += 1;
    const newDetails = newWishesDetails[index];
    const url = res.locals.settings.url.subject + newDetails.sid.toString();

    superagent.get(url)
      .end((err, html) => {
        assert.equal(err, null, 'Fetch subject fail!');

        const $ = cheerio.load(html.text);
        const playSources = $('.playBtn').toArray().map(btn => btn.attribs["data-cn"]);
        const buyPrices = $('.buylink-price > span').toArray().map(span => span.children[0].data.trim());

        newDetails.isFree = isFreeCheck(buyPrices);
        newDetails.playInfo = buyPrices.map((item, index) => {
          return {
            "source": playSources[index],
            "sourceId": getSourceId(playSources[index], res.locals.settings.sources),
            "price": item == '免费' ? 0 : cleanPrice(item)
          }
        });

        console.log(`${newDetails.title} | ${index + 1}/${newWishesDetails.length}`);

        collectSubject(res, index, newWishesDetails, startTime, res);
      });

  } else {
    console.log(`# Collect subject completed: ${elapseTime(startTime, new Date())}`);

    console.log('\n\n# Start insert @ ' + new Date().toLocaleString());
    const insertion = newWishesDetails.reverse();

    const settings = res.locals.settings;
    const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;

    MongoClient.connect(dbUrl, (err, db) => {
      assert.equal(err, null, 'Connect database fails!');

      db.collection('movieWish').insertMany(insertion, {}, (err) => {
        assert.equal(err, null, 'Insert fails!');

        console.log(`# Insert completed!`);
        db.close();
      });
    });
  }
}


function isNewDate(curDate, lastDate) {
  const cur = new Date(curDate);
  const last = new Date(lastDate)
  return cur > last;
}


function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


function elapseTime(start, end) {
  const elapse = end - start;
  const h = Math.floor(elapse / 3600000);
  const m = Math.floor((elapse - h * 3600000) / 60000);
  const s = Math.floor((elapse - h * 3600000 - m * 60000) / 1000);
  const ms = elapse - h * 3600000 - m * 60000 - s * 1000;
  return `${h}h ${m}m ${s}s ${ms}ms`;
}


function isFreeCheck(prices) {
  return prices.some(price => price == '免费');
}


function cleanPrice(price) {
  const match = reForNumber.exec(price);
  return match == null ? -1 : parseInt(match[1], 10);
}

function getSourceId(name, sources) {
  return sources.indexOf(name);
}

module.exports = data;
