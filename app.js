const express = require('express');
const path = require('path');
const mongoose =require('mongoose');

const app = express();

require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const jobRoutes = require('./routes/jobs');
app.use('/', jobRoutes);


const MONGO_URI = process.env.MONGO_URI;


mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Connection error', err));

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'main.html'));
});



app.listen(3000);
