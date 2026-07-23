import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initDb(db);

  return db;
}

export async function initDb(dbInstance: Database<sqlite3.Database, sqlite3.Statement>) {
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT,
      department TEXT,
      employeeId TEXT,
      designation TEXT
    );

    CREATE TABLE IF NOT EXISTS circulars (
      id TEXT PRIMARY KEY,
      refNo TEXT,
      title TEXT,
      type TEXT,
      department TEXT,
      targetDepts TEXT,
      targetUsers TEXT,
      subject TEXT,
      content TEXT,
      contentHtml TEXT,
      margins TEXT,
      status TEXT,
      priority TEXT,
      approvalFlow TEXT,
      createdById TEXT,
      createdAt TEXT,
      FOREIGN KEY(createdById) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS circular_attachments (
      id TEXT PRIMARY KEY,
      circular_id TEXT,
      filename TEXT,
      url TEXT,
      FOREIGN KEY(circular_id) REFERENCES circulars(id)
    );

    CREATE TABLE IF NOT EXISTS signatures (
      id TEXT PRIMARY KEY,
      circular_id TEXT,
      user_id TEXT,
      signedAt TEXT,
      FOREIGN KEY(circular_id) REFERENCES circulars(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      circular_id TEXT,
      author_id TEXT,
      message TEXT,
      timestamp TEXT,
      type TEXT,
      FOREIGN KEY(circular_id) REFERENCES circulars(id),
      FOREIGN KEY(author_id) REFERENCES users(id)
    );
  `);

  // Seed data if users table is empty
  const userCount = await dbInstance.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);
    
    const { USERS } = await import('./data');
    const seedUsers = USERS;

    for (const user of seedUsers) {
      await dbInstance.run(
        'INSERT INTO users (id, email, password_hash, name, role, department, employeeId, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, hash, user.name, user.role, user.department, user.employeeId, user.designation]
      );
    }
    console.log('Database seeded with initial users.');
  } else {
    // Upsert any new users added to USERS that don't exist yet
    const { USERS } = await import('./data');
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);
    for (const user of USERS) {
      const existing = await dbInstance.get('SELECT id FROM users WHERE id = ?', [user.id]);
      if (!existing) {
        await dbInstance.run(
          'INSERT INTO users (id, email, password_hash, name, role, department, employeeId, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [user.id, user.email, hash, user.name, user.role, user.department, user.employeeId, user.designation]
        );
        console.log(`Inserted new user: ${user.name} (${user.role})`);
      }
    }
  }
}
