// Import express Package
const express = require('express')
const router = express.Router()

// Imports authentication middleware
const { isAuthenticated } = require('../../auth/auth');

const { GetDBConnection } = require('../../db');

// Students can browse and list all the available courses and see the course title and course teacher’s name. 
router.get('/courses', isAuthenticated, async (req, res) => {

    const mainConnection = GetDBConnection();
  
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

// Students can enrol for courses. student can enrol for a course only once.
router.post('/enrol', isAuthenticated, async (req, res) => {

  const mainConnection = GetDBConnection();

  // Access post parameters
  const studentID = req.body.studentID;
  const courseID = req.body.courseID;

  // Input validation
  if (studentID == null || courseID == null) {
    res.status(400).json({ "error": "Invalid request" });
  }
  else if (isNaN(studentID)) {
    res.status(400).json({ "error": "Invalid input for student ID" });
  }
  else if (isNaN(courseID)) {
    res.status(400).json({ "error": "Invalid input for course ID" });
  }
  else {

    try {

      // Check if course ID is valid
      let sql = 'SELECT CourseID FROM courses WHERE CourseID = ?'
      const [course, _]  = await mainConnection.execute(sql, [courseID]);
      if (course.length == 0) {
        res.status(400).json({ "error": "Invalid course ID" });
      }
      else {

        //Check student exists
        let sql = 'SELECT u.UserID, r.Role FROM users u, roles r WHERE u.userID = ? AND u.RoleID = r.RoleID AND r.Role = ?'
        const [userType, _]  = await mainConnection.execute(sql, [studentID, 'Student']);
        if (userType.length == 0) {
          res.status(400).json({ "error": "Invalid student ID" });
        }
        else {
          
          // Check if student is already enrolled in the course
          let sql = 'SELECT UserID FROM enrolments WHERE UserID = ? AND CourseID = ?'
          const [student, _]  = await mainConnection.execute(sql, [studentID, courseID]);
          if (student.length > 0) {
            res.status(400).json({ "error": "Student is already enrolled in the course" });
          }
          else {
  
            // Enroll student in the course
            let sql = 'INSERT INTO enrolments (UserID, CourseID) VALUES (?, ?)'
            await mainConnection.execute(sql, [studentID, courseID]);
  
            // Send success response
            res.status(200).json({ "status": "success" });
          }
        }
      }
    } catch (err) {

      // Handle Internal server error
      const jsonContent = {error: err.message, name: err.name};
      res.status(500).json(jsonContent);
    }
  }
});

module.exports = router;