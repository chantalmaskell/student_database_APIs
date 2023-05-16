// Import express Package
const express = require('express')
const router = express.Router()

// Imports authentication middleware
const { isAuthenticated } = require('../../auth/auth');

const { GetDBConnection } = require('../../db');

//Teachers can fail or pass a student
router.post('/student/result', isAuthenticated, async (req, res) => {

    // Access post parameters
    const studentID = req.body.studentID;
    const teacherID = req.body.teacherID;
    const courseID = req.body.courseID;
    const result = req.body.result;
  
    const mainConnection = GetDBConnection();
  
    // Input validation
    if (studentID == null || teacherID == null || courseID == null || result == null) {
      res.status(400).json({ "error": "Invalid request" });
    }
    else if (studentID == "" || teacherID == "" || courseID == "" || result == "") {
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
        const [userType, _]  = await mainConnection.execute(sql, [teacherID, 'Teacher']);
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

module.exports = router;