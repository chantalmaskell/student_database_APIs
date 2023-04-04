const express = require('express')
const app = express()
const port = 3000

const mysql = require('mysql2/promise');

class ConnectionError extends Error {
  constructor(args){
      super(args);
      this.name = "ConnectionError"
  }
}

async function connectToDb() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'uni'
    });

    return connection;
  } catch (err) {
    throw new ConnectionError("Unable to connect to DB")
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

app.get('/', async (req, res) => {
  res.send("Welcome")
})

app.get('/users', async (req, res) => {

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})