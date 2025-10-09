const path = require('path');

// load environment variables
const dotenv = require('dotenv');
dotenv.config();

// connect to mongoDB
const mongoose = require('mongoose');
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
mongoose.connect(process.env.DB_URI, clientOptions)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => {
        console.log('La connexion à MongoDB a échouée !');
        console.log('Utilisez une autre base de données !');
        process.exit(1);
    });

// create express app and middlewares 
const express = require('express');
const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});
app.use(express.json());

// configure API endpoints
const bookRoutes = require('./routes/book')
const userRoutes = require('./routes/user');
app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app; 
