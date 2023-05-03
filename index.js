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

// Imports the MySQL2 package
// This import mysql2/promise to use async/await with MySQL
const mysql = require('mysql2/promise');

// Imports authentication middleware
const { isAuthenticated } = require('./auth/auth');

let mainConnection = null;

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

//Admin course availability
app.post('/admin/course/availability', isAuthenticated, async (req, res) => {

  // Access post parameters
  const userID = req.body.userID;
  const courseID = req.body.courseID;
  const course_isAvailable = req.body.isAvailable;

  // Input validation
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
      // Prepare SQL statement. Prevent SQL injection
      // Check user type is admin and authorized to access this API
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
      const [userType, _]  = await mainConnection.execute(sql, [userID, "Admin"]);
      if (userType.length == 0) {
        res.status(401).json({ "error": "Unauthorize access" });
      }
      else {

        // Check if course ID is valid
        let sql = 'SELECT CourseID FROM courses WHERE CourseID = ?'
        const [course, _]  = await mainConnection.execute(sql, [courseID]);
        if (course.length == 0) {
          res.status(400).json({ "error": "Invalid course ID" });
        }
        else {

          // Update course availability
          let sql = 'UPDATE courses SET isAvailable = ? WHERE CourseID = ?'
          await mainConnection.execute(sql, [course_isAvailable, courseID]);

          // Send success response
          res.status(200).json({ "status": "success" });
        }
      }
    }
    catch (err) {

      // Handle Internal server error
      const jsonContent = {error: err.message, name: err.name}
      res.status(500).json(jsonContent);
    }
  }
})

//Admin assign course to teachers
app.post('/admin/course/assign', isAuthenticated, async (req, res) => {

  // Access post parameters
  const userID = req.body.userID;
  const teacherID = req.body.teacherID;
  const courses = req.body.courses;

  // Input validation
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
      // Prepare SQL statement. Prevent SQL injection
      // Check user type is admin and authorized to access this API
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
      const [userType, _]  = await mainConnection.execute(sql, [userID, "Admin"]);
      if (userType.length == 0) {
        res.status(401).json({ "error": "Unauthorize access" });
      }
      else {

        // Check if teacher ID is valid
        let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
        const [teacher, _]  = await mainConnection.execute(sql, [teacherID, "Teacher"]);
        if (teacher.length == 0) {
          res.status(400).json({ "error": "Invalid teacher ID" });
        }
        else {

          // Loop through the courses and assign to teacher
          // This API allow multiple courses to be assigned to a teacher
          for (let i = 0; i < courses.length; i++) {
            let courseID = courses[i];

            if (courseID) {
              let sql = 'UPDATE courses SET TeacherID = ? WHERE CourseID = ?'
              await mainConnection.execute(sql, [teacherID, courseID]);
            }
          }

          // Send success response
          res.status(200).json({ "status": "success" });
        }
      }
    }
    catch (err) {

      // Handle Internal server error
      const jsonContent = {error: err.message, name: err.name}
      res.status(500).json(jsonContent);
    }
  }
})

//Teachers can fail or pass a student
app.post('/teacher/student/result', isAuthenticated, async (req, res) => {

  // Access post parameters
  const studentID = req.body.studentID;
  const teacherID = req.body.teacherID;
  const courseID = req.body.courseID;
  const result = req.body.result;

  // Input validation
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

      // Prepare SQL statement. Prevent SQL injection
      // Check user type is Teacher and authorized to access this API
      let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
      const [userType, userColumn]  = await mainConnection.execute(sql, [teacherID, 'Teacher']);
      if (userType.length == 0) {
        res.status(400).json({ "error": "Invalid teacher ID" });
      }
      else{

        // Check if teacher is assigned to the course
        let sql = 'SELECT title FROM courses WHERE TeacherID = ? AND CourseID = ?'
        const [teacher, _]  = await mainConnection.execute(sql, [teacherID, courseID]);
        if (teacher.length == 0) {
          res.status(401).json({ "error": "Unauthorize access" });
        }
        else {

          // Check if student is enrolled to the course
          let sql = 'SELECT CourseID FROM enrolments WHERE CourseID = ? AND UserID = ?'
          const [teacher, _]  = await mainConnection.execute(sql, [courseID, studentID]);
          if (teacher.length == 0) {
            res.status(400).json({ "error": "Student have not enrole for this course" });
          }
          else {

            let sql = 'UPDATE enrolments SET Mark = ? WHERE CourseID = ? AND UserID = ?'
            await mainConnection.execute(sql, [result, courseID, studentID]);

            // Send success response
            res.status(200).json({ "status": "success" });
          }
        }
      }
    }
    catch (err) {

      // Handle Internal server error
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

    // Send success response
    res.status(200).json(courses);
  } catch (err) {

    // Handle Internal server error
    const jsonContent = {error: err.message, name: err.name};
    res.status(500).json(jsonContent);
  }
});


//Start the server
app.listen(process.env.PORT, () => {
  console.log(`University app listening on port ${process.env.PORT}`)
})