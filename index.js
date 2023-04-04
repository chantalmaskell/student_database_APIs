const express = require('express')
const app = express()
const port = 3000
const jwt = require('jsonwebtoken');

const mysql = require('mysql2/promise');

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

function isAuthenticated(req, res, next) {
  if (typeof req.headers.authorization !== "undefined") {
      let token = req.headers.authorization.split(" ")[1];
      let privateKey = "MySuperSecretPassPhrase123";

      jwt.verify(token, privateKey, { algorithm: "HS256" }, (err, user) => {
          
          if (err) {  
              res.status(500).json({ error: "Not Authorized" });
          }
          else {
            return next();
          }
      });
  } else {
      res.status(500).json({ error: "Not Authorized" });
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})