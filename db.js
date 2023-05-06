// Imports the MySQL2 package
// This import mysql2/promise to use async/await with MySQL
const mysql = require('mysql2/promise');

//Loads config into environment variables
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

var mainConnection = null;

// Database connection
async function ConnectToDatabase() {

    //Connect to Database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    }).then((connection) => {
      mainConnection = connection;
    }).catch((err) => {
      console.log(err);
      process.exit(1);
    });
}

// Get current connection
function GetDBConnection() {
    return mainConnection;
}

module.exports =  {
    ConnectToDatabase,
    GetDBConnection
}