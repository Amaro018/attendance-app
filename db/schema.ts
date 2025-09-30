export const createTables = `
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  class_id INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  UNIQUE(name, class_id),
  FOREIGN KEY (class_id) REFERENCES classes (id)
);


CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent')),
  UNIQUE(student_id, date),                 -- one record per student per day
  FOREIGN KEY (student_id) REFERENCES students(id)
);
`;
