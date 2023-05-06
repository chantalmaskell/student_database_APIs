# CSCK542 Group Project

## Installation

Clone the project

```
git clone https://gitlab.csc.liv.ac.uk/sganiros/csck542_grp_project.git
```

Install the Packages.

```
npm install
```

## API

**All API calls should contain API Token or the requests will be rejected from the system**

### Admins

Admins should be able to enable or disable the availability of a course

```
POST 127.0.0.1:3000/api/v1/admin/course/availability
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `userID` | `int` | **Administrator ID** |
| `isAvailable` | `int` | **1(Available), 0(Unavailable)** |
| `courseID` | `int` | **Course ID** |

Admins should be able to assign one or more courses to a teacher

```
POST 127.0.0.1:3000/api/v1/admin/course/assign
```

 Parameter | Type | Description |
| :--- | :--- | :--- |
| `userID` | `int` | **Administrator ID** |
| `teacherID` | `int` | **Teacher ID** |
| `courses[]` | `int` | **Course ID** |

*Any amount of courses[] can be provided with this request since one teacher can be assigned to more than one course*

### Teachers

Teachers can fail or pass a student

```
POST 127.0.0.1:3000/api/v1/teacher/student/result
```

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `teacherID` | `int` | **Teacher ID** |
| `studentID` | `int` | **Student ID** |
| `courseID` | `int` | **Course ID** |
| `result` | `int` | **1(Pass), 0(Fail)** |

### Students

Students can browse and list all the available courses and see the course title and course teacher’s name.

```
GET 127.0.0.1:3000/api/v1/students/courses
```
