// Dependencies
const fs = require('fs');
const path = require('path');
const express = require('express');

// Export Modules
const admin = express.Router();

admin.get('/', (req, res) => {
  if (req.session) {
    const reqUsername = req.session.username;
    const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../settings.json'), 'utf8'));
    if (reqUsername == settings.user.username) {
      res.render('admin', {user: reqUsername})
    } else {
      res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
});

admin.delete('/', (req, res) => {
  req.session = null;
  res.end('');
});

module.exports = admin;
