// Import express Package
const express = require('express')
const router = express.Router()

// Imports authentication middleware
const { isAuthenticated } = require('../../auth/auth');

const { GetDBConnection } = require('../../db');
const e = require('express');

//Admin course availability
router.post('/course/availability', isAuthenticated, async (req, res) => {

    // Access post parameters
    const userID = req.body.userID;
    const courseID = req.body.courseID;
    const course_isAvailable = req.body.isAvailable;
  
    const mainConnection = GetDBConnection();
  
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
  
          // Check if course ID is valid and course has a teacher assigned
          let sql = 'SELECT TeacherID FROM courses WHERE CourseID = ?'
          const [teacher, _]  = await mainConnection.execute(sql, [courseID]);
          if (teacher.length == 0) {
            res.status(400).json({ "error": "Invalid course ID" });
          }
          else {

            // Check if teacher is assigned to the course if the course status changing to available
            if (course_isAvailable == 1 && teacher[0].TeacherID == 0) {
              res.status(400).json({ "error": "Please assign a teacher before making the course availabile for students" });
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
      }
      catch (err) {
  
        // Handle Internal server error
        const jsonContent = {error: err.message, name: err.name}
        res.status(500).json(jsonContent);
      }
    }
})
  
//Admin assign course to teachers
router.post('/course/assign', isAuthenticated, async (req, res) => {
  
    // Access post parameters
    const userID = req.body.userID;
    const teacherID = req.body.teacherID;
    const courses = req.body.courses;
  
    const mainConnection = GetDBConnection();
  
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

module.exports = router;