// Dependencies
const fs = require('fs');
const path = require('path');
const express = require('express');
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));
const username = settings.user.username;
const password = settings.user.password;

// Export Modules
const login = express.Router();


login.get('/', (req, res) => {
    res.render('login', {info: {
      flag: 1
    }});
});

login.post('/', (req, res) => {
  if (req.body.username == username && req.body.password == password) {
    req.session.username = username;
    res.redirect('/admin');
   } else {
    res.render('login', { info: {
      flag: 0,
      msg: 'Wrong username or password'
    }});
  }
});


module.exports = login;
