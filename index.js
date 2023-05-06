// Import express Package
const express = require('express')
const app = express()

// Handle JSON and Form data inside the request body
app.use(express.urlencoded({extended: true}));
app.use(express.json())

//Loads config into environment variables
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

//Imports JWT package
const jwt = require('jsonwebtoken');

// Imports database connection middleware
const { ConnectToDatabase } = require('./db');

// Connect to database
ConnectToDatabase();

// Generate JWT token for API Calls
// This is just for testing purposes
// You can use this token to test the API calls
// In Production, you will need to generate the token from the login process
app.get('/jwt', (req, res) => {
  let token = jwt.sign({ "auth": "project" }, process.env.PRIVATE_KEY, { algorithm: process.env.ALGORITHM});
  res.send(token);
})

//Home page
app.get('/', async (req, res) => {
  res.send("Welcome")
})

//API version 1
const v1_admin = require('./API/v1/admin');
const v1_teacher = require('./API/v1/teacher');
const v1_student = require('./API/v1/student');
app.use("/api/v1/admin/", v1_admin);
app.use("/api/v1/teacher/", v1_teacher);
app.use("/api/v1/students/", v1_student);


//Start the server
app.listen(process.env.PORT, () => {
  console.log(`University app listening on port ${process.env.PORT}`)
})