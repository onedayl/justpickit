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

// Settings
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));
const wishUrlPrefix = settings.url.wish;
const detailsUrlPrefix = settings.url.details;
const subjectUrlPrefix = settings.url.subject;
const dbUrl = `mongodb://${settings.host}:27017/${settings.database}`;

// Options
const reForSid = /list(\d+)/;
const reForNumber = /(\d+)/;


data.put('/', (req, res, next) => {

  MongoClient.connect(dbUrl, (err, db) => {
    assert.equal(err, null, '\n #### Connect Database Fails! ####\n');
    console.log('\n ---- Connect Database Success ----');
    console.log('\n ---- Start Collecting New Wishes... ----');

    const cursor = db.collection('movieWish').find().sort({"_id": -1}).limit(1);
    let lastWishDate = '';
    let flag = true;
    let start = -30;
    let newWishes = [];

    cursor.nextObject((err, obj) => {
      lastWishDate = obj === null ? '1970-01-01' : obj.wishDate;
      console.log('\n ---- lastWishDate: ' + lastWishDate);
      db.close();

      collectWishes(lastWishDate, flag, start, newWishes, new Date(), res);
    });
  });
});


function collectWishes(lastWishDate, flag, start, newWishes, startTime, res) {

  if (flag) {
    start += 30;
    console.log('\n ---- Collecting from: ' + start);
    const url = wishUrlPrefix + start.toString();

    superagent.get(url)
      .end((err, html) => {
        assert.equal(err, null, 'superagent fails!');
        const $ = cheerio.load(html.text);

        const sids = $(".item").toArray().map(item => reForNumber.exec(item.attribs.id)[1]);
        const dates = $('.date').toArray().map(date => date.children[0].data.trim());

        if (dates.length !== 0) {
          if (dates.length < 30) {
            flag = false;
          }

          for (let i = 0; i < dates.length; i++) {
            if (isNewDate(dates[i], lastWishDate)) {

              console.log(`wish: ${sids[i]} | ${dates[i]}`);
              const newWish = {
                "sid": sids[i],
                "wishDate": dates[i]
              };
              newWishes.push(newWish);

            } else {
              flag = false;
              break;
            }
          }
        } else {
          flag = false;
        }
        collectWishes(lastWishDate, flag, start, newWishes, startTime, res);
      });

  } else if (newWishes.length === 0) {
    console.log('\n ---- No new wish ----');
    res.end('No new wish');

  } else {
    console.log(`\n ---- New Wishes: ${newWishes.length} | ${elapseTime(startTime, new Date())} ----\n`);
    res.end('New wishes:' + newWishes.length);

    let index = -1;
    let newWishesDetails = [];
    const sleepTime = newWishes.length > 99  ? 36000 : 2000;

    collectDetails(index, newWishes, newWishesDetails, sleepTime, new Date());
  }
}


function collectDetails(index, newWishes, newWishesDetails, sleepTime, startTime) {

  if (index < newWishes.length - 1) {
    index += 1;
    const newWish = newWishes[index];
    const url = detailsUrlPrefix + newWish.sid;

    superagent.get(url)
      .end((err, data) => {
        if (err === null) {
          const details = JSON.parse(data.text);

          newWishesDetails.push({
            "sid":      newWish.sid,
            "wishDate": newWish.wishDate,
            "title":    details.title,
            "year":     details.year,
            "rating":   details.rating.average,
            "images":   details.images,
            "genres":   details.genres,
            "summary":  details.summary
          });

          console.log(`Details: ${newWish.sid}|${details.title}|${index + 1}/${newWishes.length}`);

          if (index + 1 != newWishes.length) {
            console.log(`---- wait ${sleepTime / 1000}s ... ----\n`);

            sleep(sleepTime).then(() => {
              collectDetails(index, newWishes, newWishesDetails, sleepTime, startTime);
            });

          } else {
            collectDetails(index, newWishes, newWishesDetails, sleepTime, startTime);
          }

        } else {
          collectDetails(index, newWishes, newWishesDetails, sleepTime, startTime);
        }
      });

  } else {
    console.log(`\n---- collectDetails completed: ${elapseTime(startTime, new Date())} ----\n`);

    index = -1;
    collectSubject(index, newWishesDetails, new Date());
  }
}


function collectSubject(index, newWishesDetails, startTime) {

  if (index < newWishesDetails.length - 1) {
    index += 1;
    const newDetails = newWishesDetails[index];
    const url = subjectUrlPrefix + newDetails.sid.toString();

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
            "price": item == '免费' ? 0 : cleanPrice(item)
          }
        });

        console.log(`collectSubject: ${newDetails.title}|${index + 1}/${newWishesDetails.length}`);

        collectSubject(index, newWishesDetails, startTime);
      });

  } else {
    console.log(`\n---- collectSubject completed: ${elapseTime(startTime, new Date())} ----`);

    console.log('\n---- Start inserting ... ----');
    const insertion = newWishesDetails.reverse();

    MongoClient.connect(dbUrl, (err, db) => {
      assert.equal(err, null, 'Connect database fails!');

      db.collection('movieWish').insertMany(insertion, {}, (err) => {
        assert.equal(err, null, 'Insert fails!');

        console.log(`\n---- insert completed! ----`);
        db.close();
      });
    });
  }
}


function isNewDate(curWishDate, lastWishDate) {
  const curDate = new Date(curWishDate);
  const lastDate = new Date(lastWishDate)
  return curDate > lastDate;
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


module.exports = data;
