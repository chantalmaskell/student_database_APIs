const express = require('express')
const app = express()

// Handle JSON and Form data inside the request body
app.use(express.urlencoded({extended: true}));
app.use(express.json())

//Loads environment variables from a .env
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

const jwt = require('jsonwebtoken');

const mysql = require('mysql2');

const { isAuthenticated } = require('./auth/auth');

//Connect to Database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Handle the database connection error 
connection.on('error', function(err) {
  console.log("[Database error] : ",err);
  process.exit(1);
});

//Generate JWT token for API Calls
app.get('/jwt', (req, res) => {
  let token = jwt.sign({ "auth": "project" }, process.env.PRIVATE_KEY, { algorithm: process.env.ALGORITHM});
  res.send(token);
})

//Home page
app.get('/', async (req, res) => {
  res.send("Welcome")
})

//Admin page
app.post('/admin', isAuthenticated, async (req, res) => {

  const userID = req.body.userID;
  const course_status = req.body.status;

  try {
    connection.query('SELECT * FROM users WHERE userID = ' + userID , function(err, results, fields) {
      res.json(results);
    });
  }
  catch (err) {
    const jsonContent = {error: err.message, name: err.name}
    res.json(jsonContent);
  }
})

//Start the server
app.listen(process.env.PORT, () => {
  console.log(`University app listening on port ${process.env.PORT}`)
})