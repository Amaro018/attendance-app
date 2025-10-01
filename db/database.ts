import * as SQLite from "expo-sqlite";
import { createTables } from "./schema";

const db = SQLite.openDatabaseSync("attendance.db");



// ✅ Initialize DB tables
export const initDB = async () => {
  await db.execAsync(createTables);
};


// ✅ Classes
export const addClass = async (name: string) => {
  await db.runAsync("INSERT INTO classes (name) VALUES (?)", [name]);
};
export const getClasses = async () =>
  db.getAllAsync<any>("SELECT * FROM classes");

export const updateClass = async (id: number, name: string) => {
  await db.runAsync("UPDATE classes SET name = ? WHERE id = ?", name, id);
};
export const deleteClass = async (id: number) =>
  db.runAsync("DELETE FROM classes WHERE id = ?", [id]);

// ✅ Students
export const addStudent = async (name: string, class_id: number, gender: string) => {
  console.log(name, class_id, gender);
  await db.runAsync(
    "INSERT INTO students (name, class_id, gender) VALUES (?, ?, ?)",
    [name, class_id, gender]
  );
};
export const getStudents = async () =>
  db.getAllAsync<any>("SELECT * FROM students");
export const getStudentsByClass = async (classId: number) =>
  db.getAllAsync<any>(
    "SELECT * FROM students WHERE class_id = ?",
    [classId]
  );


export const updateStudent = async (id: number, name: string, gender: string) => {
  await db.runAsync(
    "UPDATE students SET name = ?, gender = ? WHERE id = ?",
    name,
    gender,
    id
  );
};



// ✅ Attendance
export const markAttendance = async (
  studentId: number,
  date: string,
  status: "present" | "absent"
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO attendance (student_id, date, status)
     VALUES (?, ?, ?)`,
    [studentId, date, status]
  );
};

export const getAttendanceByDate = async (date: string) =>
  db.getAllAsync<any>(
    `SELECT s.name, a.status
       FROM students s
       LEFT JOIN attendance a
         ON s.id = a.student_id AND a.date = ?
      ORDER BY s.name`,
    [date]
  );

export const getAttendanceForClass = async (classId: number, date: string) =>
  db.getAllAsync<any>(
    `SELECT s.*, a.status
       FROM students s
       LEFT JOIN attendance a
         ON s.id = a.student_id AND a.date = ?
      WHERE s.class_id = ?
      ORDER BY s.name`,
    [date, classId]
  );

export const getAttendanceLog = async () =>
  db.getAllAsync<any>(
    `SELECT a.date, s.name, a.status
       FROM attendance a
       JOIN students s ON a.student_id = s.id
      ORDER BY a.date DESC`
  );

export const getAttendanceByStudent = async (studentId: number) => {
  return await db.getAllAsync<any>(
    `SELECT date, status
       FROM attendance
      WHERE student_id = ?
      ORDER BY date DESC`,
    [studentId]
  );
};


// // ✅ Clear All
// export const clearAllData = async () => {
//   await db.execAsync(`
//     DROP TABLE IF EXISTS attendance;
//     DROP TABLE IF EXISTS students;
//     DROP TABLE IF EXISTS classes;
//   `);
//   await db.execAsync(createTables);
// };


// export const seedDatabase = async () => {
//   // Sample students (assuming IDs 1–4)
//   const studentIds = [1, 2, 3, 4];
//   const startDate = new Date("2025-10-01");

//   // Insert sample classes
//   await db.execAsync(`
//     INSERT INTO classes (name) VALUES 
//     ('Section A'),
//     ('Section B');
//   `);

//   // Insert sample students
//   await db.execAsync(`
//     INSERT INTO students (name, class_id, gender) VALUES
//     ('Juan Dela Cruz', 1, 'male'),
//     ('Maria Santos', 1, 'female'),
//     ('Pedro Reyes', 2, 'male'),
//     ('Anna Lopez', 2, 'female');
//   `);

//   // Build bulk attendance insert statements
//   let attendanceSQL = "INSERT INTO attendance (student_id, date, status) VALUES";
//   let values = [];

//   for (let i = 0; i < 10; i++) { // 10 days
//     const dateString = new Date(startDate.getTime() + i * 86400000)
//       .toISOString()
//       .split("T")[0]; // e.g., '2025-10-01'
//     for (const id of studentIds) {
//       // Alternate status for some randomness
//       const status = (i + id) % 2 === 0 ? "present" : "absent";
//       values.push(`(${id}, '${dateString}', '${status}')`);
//     }
//   }
//   attendanceSQL += values.join(",") + ";";

//   // Insert bulk attendance
//   await db.execAsync(attendanceSQL);

//   console.log("Seeded 10 attendance records per student!");
// };


export default db;
