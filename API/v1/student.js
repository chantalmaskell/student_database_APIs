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

module.exports = router;