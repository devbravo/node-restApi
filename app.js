const path = require('path');
const express = require('express');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config/config');
const multer = require('multer');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//app.use(express.urlencoded()); // x-www-form-urlencoded <form
app.use(express.json()); // parse incoming json data applicaton/json
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')); // inform multer that a single file will be stored
app.use('/images', express.static(path.join(__dirname, 'images')));

// setHeader will modify the response and add a new header
// '*' wildcart allows access to many clients
// every response sent will have the header below
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => {
    app.listen(8080, () => console.log('server listening at port 8080'));
  })
  .catch(err => console.log(err));
