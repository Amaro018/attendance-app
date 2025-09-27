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

// Sections helpers
export const addSection = async (name: string) => {
  await db.runAsync('INSERT INTO sections (name) VALUES (?)', name);
};

export const getSections = async (): Promise<any[]> => {
  return await db.getAllAsync<any>('SELECT * FROM sections');
};

// Students helpers
export const addStudent = async (name: string, class_id: number, section_id: number) => {
  await db.runAsync(
    'INSERT INTO students (name, class_id, section_id) VALUES (?, ?, ?)',
    name,
    class_id,
    section_id
  );
};

export const getStudents = async (): Promise<any[]> => {
  return await db.getAllAsync<any>('SELECT * FROM students');
};

export default db;
