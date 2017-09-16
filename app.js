const path = require('path');
const express = require('express');
const pug = require('pug');
const app = express();

// routes
const index = require('./routes/index');
const list = require('./routes/list');
const data = require('./routes/data');
//cons admin = require('./routes/admin');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// static file
app.use(express.static(path.join(__dirname, 'public')));

// user
app.use('/', index);
app.use('/list', list);

// admin
// app.use('/admin', admin);

// process
app.use('/data', data);

app.use((req, res) => {
  res.status(404).send('Not Found!');
});

app.listen(3000, () => {
  console.log('Listening on 3000.');
})
