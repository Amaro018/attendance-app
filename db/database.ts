import * as SQLite from "expo-sqlite";
import { createTables } from "./schema";

// ✅ Classes

let dbInstance: SQLite.SQLiteDatabase | null = null;

const getDB = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("attendance.db");
  }
  return dbInstance;
};

// ✅ Initialize DB tables
export const initDB = async () => {
  const db = await getDB();
  await db.execAsync(createTables);
};

export const addClass = async (name: string) => {
  const db = await getDB();
  const existing = await db.getAllAsync<any>("SELECT * FROM classes WHERE name = ?", [name]);
  if (existing.length > 0) {
    // Return failure, don't show alert here!
    return { success: false, message: "Class already exists" };
  }
  await db.runAsync("INSERT INTO classes (name) VALUES (?)", [name]);
  return { success: true };
};


export const getClasses = async () => {
  const db = await getDB();
  return db.getAllAsync<any>("SELECT * FROM classes");
}

// In your database utility file:
export const updateClass = async (id: number, name: string) => {
  const db = await getDB();
  // Optionally, check for duplicate class name if needed
  const existing = await db.getAllAsync<any>("SELECT * FROM classes WHERE name = ? AND id != ?", [name, id]);
  if (existing.length > 0) {
    return { success: false, message: "Class name already exists" };
  }

  await db.runAsync("UPDATE classes SET name = ? WHERE id = ?", [name, id]);
  return { success: true };
};

export const deleteClass = async (id: number) => {
  const db = await getDB();
  // Cascade: delete attendance for all students in class, then students, then class
  await db.runAsync(
    "DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)",
    [id]
  );
  await db.runAsync("DELETE FROM students WHERE class_id = ?", [id]);
  return db.runAsync("DELETE FROM classes WHERE id = ?", [id]);
}

// ✅ Students
export const addStudent = async (name: string, class_id: number, gender: string) => {
  const db = await getDB();
  // First, check for duplicate
  const existing = await db.getAllAsync<any>(
    "SELECT * FROM students WHERE name = ? AND class_id = ?",
    [name, class_id]
  );
  if (existing.length > 0) {
    // Student with this name already exists in this class
    return { success: false, message: "Student already exists in this class." };
  }

  // Insert student if not duplicate
  await db.runAsync(
    "INSERT INTO students (name, class_id, gender) VALUES (?, ?, ?)",
    [name, class_id, gender]
  );
  return { success: true };
};



export const getStudents = async () => {
  const db = await getDB();
  return db.getAllAsync<any>("SELECT * FROM students");
}
export const getStudentsByClass = async (classId: number) => {
  const db = await getDB();
  return db.getAllAsync<any>(
    "SELECT * FROM students WHERE class_id = ?",
    [classId]
  );
}


export const updateStudent = async (id: number, name: string, gender: string) => {
  const db = await getDB();
  // First, get this student's class_id
  const thisStudent = await db.getAllAsync<any>(
    "SELECT class_id FROM students WHERE id = ?",
    [id]
  );

  if (!thisStudent.length) {
    return { success: false, message: "Student not found." };
  }
  const class_id = thisStudent[0].class_id;

  // Check for duplicate name in the same class (excluding the current student)
  const duplicate = await db.getAllAsync<any>(
    "SELECT id FROM students WHERE name = ? AND class_id = ? AND id != ?",
    [name, class_id, id]
  );
  if (duplicate.length > 0) {
    return { success: false, message: "Another student with that name already exists in this class." };
  }

  // Perform update
  await db.runAsync(
    "UPDATE students SET name = ?, gender = ? WHERE id = ?",
    [name, gender, id]
  );
  return { success: true };
};




export const deleteStudent = async (id: number) => {
  const db = await getDB();
  await db.runAsync("DELETE FROM attendance WHERE student_id = ?", [id]);
  return db.runAsync("DELETE FROM students WHERE id = ?", [id]);
};

export const getStudentCountsByClass = async () => {
  const db = await getDB();
  return db.getAllAsync<{ class_id: number; count: number }>(
    "SELECT class_id, COUNT(*) as count FROM students GROUP BY class_id"
  );
};

// ✅ Attendance
export const markAttendance = async (
  studentId: number,
  date: string,
  status: "present" | "absent" | "excused" | "cutting"
) => {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO attendance (student_id, date, status)
     VALUES (?, ?, ?)`,
    [studentId, date, status]
  );
};

export const markAllPresent = async (classId: number, date: string) => {
  const db = await getDB();
  const students = await db.getAllAsync<{ id: number }>(
    "SELECT id FROM students WHERE class_id = ?",
    [classId]
  );
  for (const s of students) {
    await db.runAsync(
      `INSERT OR REPLACE INTO attendance (student_id, date, status) VALUES (?, ?, 'present')`,
      [s.id, date]
    );
  }
};

export const getAttendanceByDate = async (date: string) => {
  const db = await getDB();
  return db.getAllAsync<any>(
    `SELECT s.name, a.status
       FROM students s
       LEFT JOIN attendance a
         ON s.id = a.student_id AND a.date = ?
      ORDER BY s.name`,
    [date]
  );
}

export const getAttendanceForClass = async (classId: number, date: string) => {
  const db = await getDB();
  return db.getAllAsync<any>(
    `SELECT s.*, a.status
       FROM students s
       LEFT JOIN attendance a
         ON s.id = a.student_id AND a.date = ?
      WHERE s.class_id = ?
      ORDER BY s.name`,
    [date, classId]
  );
}

export const getAttendanceLog = async () => {
  const db = await getDB();
  return db.getAllAsync<any>(
    `SELECT a.date, s.name, a.status
       FROM attendance a
       JOIN students s ON a.student_id = s.id
      ORDER BY a.date DESC`
  );
}

export const getAttendanceByStudent = async (studentId: number) => {
  const db = await getDB();
  return await db.getAllAsync<any>(
    `SELECT date, status
       FROM attendance
      WHERE student_id = ?
      ORDER BY date DESC`,
    [studentId]
  );
};

export const getClassAttendanceHistory = async (classId: number) => {
  const db = await getDB();
  return db.getAllAsync<any>(
    `SELECT s.name, a.date, a.status
       FROM students s
       LEFT JOIN attendance a ON s.id = a.student_id
      WHERE s.class_id = ?
      ORDER BY a.date DESC, s.name ASC`,
    [classId]
  );
};

export const getClassAttendanceByMonth = async (classId: number, year: number, month: number) => {
  const db = await getDB();
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  return db.getAllAsync<any>(
    `SELECT s.name, s.gender, a.date, a.status
       FROM students s
       LEFT JOIN attendance a
         ON s.id = a.student_id AND a.date LIKE ?
      WHERE s.class_id = ?
      ORDER BY s.name ASC, a.date ASC`,
    [`${prefix}%`, classId]
  );
};


// ✅ Clear All
export const clearAllData = async () => {
  const db = await getDB();
  await db.execAsync(`
    DROP TABLE IF EXISTS attendance;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS classes;
  `);
  await db.execAsync(createTables);
};

export default getDB;