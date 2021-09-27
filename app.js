const config = require('./utils/config');
const express = require('express');
const app = express();
const cors = require('cors');
const blogsRouter = require('./controllers/blogs');
const mongoose = require('mongoose');

console.log('Connecting to ', config.MONGODB_URI);

mongoose
	.connect(config.MONGODB_URI)
	.then(() => {
		console.log('Connected to mongoDB');
	})
	.catch((error) => {
		console.log('Error connecting to mongoDB', error.message);
	});

app.use(cors());
app.use(express.json());

app.use('/api/blogs', blogsRouter);

module.exports = app;
