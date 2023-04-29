const express = require('express')
const app = express()

// Handle JSON and Form data inside the request body
app.use(express.urlencoded({extended: true}));
app.use(express.json())

//Loads environment variables from a .env
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

const jwt = require('jsonwebtoken');

const mysql = require('mysql2/promise');

const { isAuthenticated } = require('./auth/auth');

let mainConnection = null;

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

ConnectToDatabase();

//Generate JWT token for API Calls
app.get('/jwt', (req, res) => {
  let token = jwt.sign({ "auth": "project" }, process.env.PRIVATE_KEY, { algorithm: process.env.ALGORITHM});
  res.send(token);
})

//Home page
app.get('/', async (req, res) => {
  res.send("Welcome")
})

//Admin course availability
app.post('/admin/course/availability', isAuthenticated, async (req, res) => {

  const userID = req.body.userID;
  const courseID = req.body.courseID;
  const course_isAvailable = req.body.isAvailable;

  if (userID == null || course_isAvailable == null || courseID == null) {
    res.json({ "error": "Invalid request" });
  }
  else if (isNaN(courseID)) {
    res.json({ "error": "Invalid input for course ID" });
  }
  else if (isNaN(course_isAvailable)) {
    res.json({ "error": "Invalid input for status" });
  }
  else if (course_isAvailable > 1) {
    res.json({ "error": "Invalid input for status" });
  }
  else {

    try {
      //Prepare SQL statement. Prevent SQL injection
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID'
      const [userType, userColumn]  = await mainConnection.execute(sql, [userID]);
      if (userType.length == 0) {
        res.json({ "error": "User not found" });
      }
      else if (userType[0].Role == "Admin") {

        let sql = 'SELECT CourseID FROM courses WHERE CourseID = ?'
        const [course, userColumn]  = await mainConnection.execute(sql, [courseID]);
        if (course.length == 0) {
          res.json({ "error": "Invalid course ID" });
        }
        else {
          let sql = 'UPDATE courses SET isAvailable = ? WHERE CourseID = ?'
          await mainConnection.execute(sql, [course_isAvailable, courseID]);
          res.json({ "status": "success" });
        }
      }
      else {
        res.json({ "error": "Unauthorize access" });
      }
    }
    catch (err) {
      const jsonContent = {error: err.message, name: err.name}
      res.json(jsonContent);
    }
  }
})

//Admin assign course to teachers
app.post('/admin/course/assign', isAuthenticated, async (req, res) => {

  const userID = req.body.userID;
  const teacherID = req.body.teacherID;
  const courses = req.body.courses;

  if (userID == null || teacherID == null || courses == null) {
    res.json({ "error": "Invalid request" });
  }
  else if (isNaN(teacherID)) {
    res.json({ "error": "Invalid input for teacher ID" });
  }
  else if (courses.length == 0) {
    res.json({ "error": "Please select course/s  to assign to teacher" });
  }
  else {

    try {
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID'
      const [userType, userColumn]  = await mainConnection.execute(sql, [userID]);
      if (userType.length == 0) {
        res.json({ "error": "User not found" });
      }
      else if (userType[0].Role == "Admin") {

        let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID'
        const [teacher, userColumn]  = await mainConnection.execute(sql, [teacherID]);
        if (teacher.length == 0) {
          res.json({ "error": "Invalid teacher ID" });
        }
        else if (teacher[0].Role != "Teacher") {
          res.json({ "error": "Invalid teacher ID" });
        }
        else {
          for (let i = 0; i < courses.length; i++) {
            let courseID = courses[i];

            if (courseID) {
              let sql = 'UPDATE courses SET TeacherID = ? WHERE CourseID = ?'
              await mainConnection.execute(sql, [teacherID, courseID]);
            }
          }

          res.json({ "status": "success" });
        }
      }
      else {
        res.json({ "error": "Unauthorize access" });
      }
    }
    catch (err) {
      const jsonContent = {error: err.message, name: err.name}
      res.json(jsonContent);
    }
  }
})

// Students can browse and list all the available courses and see the course title and course teacher’s name. 

app.get('/courses', async (req, res) => {
  try {
    // Prepare SQL statement to get course information with teacher name
    let sql = ` SELECT courses.Title AS CourseTitle, CONCAT(users.Name, ' (', roles.Role, ')') AS TeacherName
    FROM courses
    INNER JOIN users ON courses.TeacherID = users.UserID
    INNER JOIN roles ON users.RoleID = roles.RoleID
    WHERE courses.isAvailable = 1 AND roles.Role = 'Teacher';
    `
    const [courses, _] = await mainConnection.execute(sql);
    res.json(courses);
  } catch (err) {
    const jsonContent = {error: err.message, name: err.name};
    res.status(500).json(jsonContent);
  }
});


//Start the server
app.listen(process.env.PORT, () => {
  console.log(`University app listening on port ${process.env.PORT}`)
})