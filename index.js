const express = require('express')
const app = express()

const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

const mysql = require('mysql2/promise');

const { isAuthenticated } = require('./auth/auth');

async function connectToDb() {

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    });

    return connection;
  } catch (err) {
    throw new Error("Unable to connect to DB")
  }
}

async function selectAllUsers(con) {

  try {
    const [rows, fields] = await con.execute('SELECT * FROM users');
    return rows;
  } catch (error) {
    throw error;
  }
}

app.get('/jwt', (req, res) => {
  let token = jwt.sign({ "auth": "project" }, "MySuperSecretPassPhrase", { algorithm: 'HS256'});
  res.send(token);
})


app.get('/', async (req, res) => {
  res.send("Welcome")
})

app.get('/users', isAuthenticated, async (req, res) => {

  try {
    const connection = await connectToDb();
    const data = await selectAllUsers(connection);
    res.json(data);
  }
  catch (err) {
    const jsonContent = {error: err.message, name: err.name}
    res.json(jsonContent);
  }
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})