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
    res.status(400).json({ "error": "Invalid request" });
  }
  else if (isNaN(courseID)) {
    res.status(400).json({ "error": "Invalid input for course ID" });
  }
  else if (isNaN(course_isAvailable)) {
    res.status(400).json({ "error": "Invalid input for status" });
  }
  else if (course_isAvailable > 1) {
    res.status(400).json({ "error": "Invalid input for status" });
  }
  else {

    try {
      //Prepare SQL statement. Prevent SQL injection
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
      const [userType, _]  = await mainConnection.execute(sql, [userID, "Admin"]);
      if (userType.length == 0) {
        res.status(401).json({ "error": "Unauthorize access" });
      }
      else {

        let sql = 'SELECT CourseID FROM courses WHERE CourseID = ?'
        const [course, _]  = await mainConnection.execute(sql, [courseID]);
        if (course.length == 0) {
          res.status(400).json({ "error": "Invalid course ID" });
        }
        else {
          let sql = 'UPDATE courses SET isAvailable = ? WHERE CourseID = ?'
          await mainConnection.execute(sql, [course_isAvailable, courseID]);
          res.status(200).json({ "status": "success" });
        }
      }
    }
    catch (err) {
      const jsonContent = {error: err.message, name: err.name}
      res.status(500).json(jsonContent);
    }
  }
})

//Admin assign course to teachers
app.post('/admin/course/assign', isAuthenticated, async (req, res) => {

  const userID = req.body.userID;
  const teacherID = req.body.teacherID;
  const courses = req.body.courses;

  if (userID == null || teacherID == null || courses == null) {
    res.status(400).json({ "error": "Invalid request" });
  }
  else if (isNaN(teacherID)) {
    res.status(400).json({ "error": "Invalid input for teacher ID" });
  }
  else if (courses.length == 0) {
    res.status(400).json({ "error": "Please select course/s  to assign to teacher" });
  }
  else {

    try {
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
      const [userType, _]  = await mainConnection.execute(sql, [userID, "Admin"]);
      if (userType.length == 0) {
        res.status(401).json({ "error": "Unauthorize access" });
      }
      else {

        let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
        const [teacher, _]  = await mainConnection.execute(sql, [teacherID, "Teacher"]);
        if (teacher.length == 0) {
          res.status(400).json({ "error": "Invalid teacher ID" });
        }
        else {
          for (let i = 0; i < courses.length; i++) {
            let courseID = courses[i];

            if (courseID) {
              let sql = 'UPDATE courses SET TeacherID = ? WHERE CourseID = ?'
              await mainConnection.execute(sql, [teacherID, courseID]);
            }
          }

          res.status(200).json({ "status": "success" });
        }
      }
    }
    catch (err) {
      const jsonContent = {error: err.message, name: err.name}
      res.status(500).json(jsonContent);
    }
  }
})

//Teachers can fail or pass a student
app.post('/teacher/student/result', isAuthenticated, async (req, res) => {

  const studentID = req.body.studentID;
  const teacherID = req.body.teacherID;
  const courseID = req.body.courseID;
  const result = req.body.result;

  if (studentID == null || teacherID == null || courseID == null || result == null) {
    res.status(400).json({ "error": "Invalid request" });
  }
  else if (isNaN(studentID)) {
    res.status(400).json({ "error": "Invalid input for student ID" });
  }
  else if (isNaN(teacherID)) {
    res.status(400).json({ "error": "Invalid input for teacher ID" });
  }
  else if (isNaN(courseID)) {
    res.status(400).json({ "error": "Invalid input for course ID" });
  }
  else if (isNaN(result)) {
    res.status(400).json({ "error": "Invalid input for result" });
  }
  else if (result > 1 || result < 0) {
    res.status(400).json({ "error": "Only 0 or 1 allowed for result" });
  }
  else {

    try {
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
      const [userType, userColumn]  = await mainConnection.execute(sql, [teacherID, 'Teacher']);
      if (userType.length == 0) {
        res.status(400).json({ "error": "Invalid teacher ID" });
      }
      else{

        let sql = 'SELECT title FROM courses WHERE TeacherID = ? AND CourseID = ?'
        const [teacher, _]  = await mainConnection.execute(sql, [teacherID, courseID]);
        if (teacher.length == 0) {
          res.status(401).json({ "error": "Unauthorize access" });
        }
        else {
          let sql = 'SELECT CourseID FROM enrolments WHERE CourseID = ? AND UserID = ?'
          const [teacher, _]  = await mainConnection.execute(sql, [courseID, studentID]);
          if (teacher.length == 0) {
            res.status(400).json({ "error": "Student have not enrole for this course" });
          }
          else {

            let sql = 'UPDATE enrolments SET Mark = ? WHERE CourseID = ? AND UserID = ?'
            await mainConnection.execute(sql, [result, courseID, studentID]);
            res.status(200).json({ "status": "success" });
          }
        }
      }
    }
    catch (err) {
      const jsonContent = {error: err.message, name: err.name}
      res.status(500).json(jsonContent);
    }
  }
})

// Students can browse and list all the available courses and see the course title and course teacher’s name. 
app.get('/courses', async (req, res) => {
  try {
    // Prepare SQL statement to get course information with teacher name
    let sql = ` SELECT courses.Title AS CourseTitle, users.Name AS TeacherName
        FROM courses
        INNER JOIN users ON courses.TeacherID = users.UserID
        INNER JOIN roles ON users.RoleID = roles.RoleID
        WHERE courses.isAvailable = 1 AND roles.Role = 'Teacher';
    `
    const [courses, _] = await mainConnection.execute(sql);
    res.status(200).json(courses);
  } catch (err) {
    const jsonContent = {error: err.message, name: err.name};
    res.status(500).json(jsonContent);
  }
});


//Start the server
app.listen(process.env.PORT, () => {
  console.log(`University app listening on port ${process.env.PORT}`)
})