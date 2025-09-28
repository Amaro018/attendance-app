import * as SQLite from 'expo-sqlite';
import { createTables } from './schema';

// ✅ Open the database (new API)
const db = SQLite.openDatabaseSync('attendance.db');

// Initialize tables
export const initDB = async () => {
  await db.execAsync(createTables);
};

// Classes helpers
export const addClass = async (name: string) => {
  await db.runAsync('INSERT INTO classes (name) VALUES (?)', name);
};

export const getClasses = async (): Promise<any[]> => {
  const result = await db.getAllAsync<any>('SELECT * FROM classes');
  return result;
};

export const deleteClass = async (id: number) => {
  await db.runAsync('DELETE FROM classes WHERE id = ?', id);
  console.log('Deleted', id);
}

// Sections helpers
export const addSection = async (name: string) => {
  await db.runAsync('INSERT INTO sections (name) VALUES (?)', name);
};

export const getSections = async (): Promise<any[]> => {
  return await db.getAllAsync<any>('SELECT * FROM sections');
};

// Students helpers
export const addStudent = async (name: string, class_id: number) => {
  await db.runAsync(
    'INSERT INTO students (name, class_id) VALUES (?, ?)',
    name,
    class_id,
  );
};

export const getStudents = async (): Promise<any[]> => {
  return await db.getAllAsync<any>('SELECT * FROM students');
};

export const getStudentsByClass = async (classId: number): Promise<any[]> => {
  return await db.getAllAsync<any>(
    "SELECT * FROM students WHERE class_id = ?",
    classId
  );
};

export const clearAllData = async () => {
  await db.execAsync(`
    DELETE FROM students;
    DELETE FROM classes;
    DELETE FROM sections;
  `);
};

export default db;
