const fs = require('fs');
const path = require('path');
const express = require('express');
const pug = require('pug');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const app = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, './settings.json'), 'utf8'));

// routes
const index = require('./routes/index');
const list = require('./routes/list');
const data = require('./routes/data');
const login = require('./routes/login');
const admin = require('./routes/admin');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
  name: 'jpilogin',
  secret: settings.secret,
  maxAge: 30 * 60 * 1000
}));



// user
app.use('/', index);
app.use('/list', list);

//admin
app.use('/login',urlencodedParser, login);
app.use('/admin', admin);

// process
app.use('/data', data);

app.use((req, res) => {
  res.status(404).send('Not Found!');
});

app.listen(3000, () => {
  console.log('Listening on 3000.');
})
