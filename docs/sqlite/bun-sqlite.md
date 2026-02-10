# Bun SQLite Guide

## Basic Setup

```javascript
import { Database } from 'bun:sqlite';

// Create/open a database
const db = new Database('mydb.sqlite'); // File-based
// or
const db = new Database(':memory:'); // In-memory
// or
const db = new Database(); // In-memory (shorthand)
```

## Creating Tables

```javascript
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER
  )
`);
```

## Inserting Data

**Simple insert:**

```javascript
db.run(
  "INSERT INTO users (name, email, age) VALUES ('Alice', 'alice@example.com', 30)"
);
```

**Parameterized queries (recommended):**

```javascript
// Using positional parameters
db.run('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', [
  'Bob',
  'bob@example.com',
  25
]);

// Using named parameters
db.run('INSERT INTO users (name, email, age) VALUES ($name, $email, $age)', {
  $name: 'Charlie',
  $email: 'charlie@example.com',
  $age: 35
});
```

## Querying Data

**Get all rows:**

```javascript
const users = db.query('SELECT * FROM users').all();
// Returns: [{ id: 1, name: 'Alice', ... }, ...]
```

**Get single row:**

```javascript
const user = db.query('SELECT * FROM users WHERE id = ?').get(1);
// Returns: { id: 1, name: 'Alice', ... } or undefined
```

**With parameters:**

```javascript
const adults = db.query('SELECT * FROM users WHERE age >= ?').all(18);
```

## Prepared Statements

```javascript
// Prepare once, execute multiple times
const insertStmt = db.prepare(
  'INSERT INTO users (name, email, age) VALUES (?, ?, ?)'
);

insertStmt.run('Dave', 'dave@example.com', 28);
insertStmt.run('Eve', 'eve@example.com', 32);

// Query statements
const getByAge = db.prepare('SELECT * FROM users WHERE age > ?');
const results = getByAge.all(25);
```

## Transactions

```javascript
const insertMany = db.transaction((users) => {
  const stmt = db.prepare(
    'INSERT INTO users (name, email, age) VALUES (?, ?, ?)'
  );
  for (const user of users) {
    stmt.run(user.name, user.email, user.age);
  }
});

// Execute transaction (all or nothing)
insertMany([
  { name: 'Frank', email: 'frank@example.com', age: 40 },
  { name: 'Grace', email: 'grace@example.com', age: 22 }
]);
```

## Methods Overview

- **`db.run(sql, ...params)`** - Execute SQL, returns nothing (for INSERT/UPDATE/DELETE)
- **`db.query(sql)`** - Returns a prepared query object
  - `.all(...params)` - Get all matching rows
  - `.get(...params)` - Get first matching row
  - `.values(...params)` - Get rows as arrays instead of objects
- **`db.prepare(sql)`** - Create reusable prepared statement
- **`db.transaction(fn)`** - Create a transaction function

## Useful Properties

```javascript
// Get last inserted row ID
db.run('INSERT INTO users (name, email) VALUES (?, ?)', [
  'Helen',
  'helen@example.com'
]);
console.log(db.lastInsertRowId); // e.g., 8

// Get number of changes from last operation
db.run("UPDATE users SET age = 31 WHERE name = 'Alice'");
console.log(db.changes); // 1

// Get total changes since connection opened
console.log(db.totalChanges);
```

## Close Database

```javascript
db.close();
```

## Complete Example

```javascript
import { Database } from 'bun:sqlite';

const db = new Database('app.sqlite');

// Setup
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at INTEGER DEFAULT (unixepoch())
  )
`);

// Insert
const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
insert.run('John Doe', 'john@example.com');

// Query
const allUsers = db.query('SELECT * FROM users').all();
console.log(allUsers);

// Update
db.run('UPDATE users SET name = ? WHERE email = ?', [
  'John Smith',
  'john@example.com'
]);

// Delete
db.run('DELETE FROM users WHERE id = ?', [1]);

db.close();
```

## Performance Tips

1. **Use prepared statements** for repeated queries
2. **Use transactions** for bulk inserts/updates (much faster)
3. **Enable WAL mode** for better concurrency:
   ```javascript
   db.run('PRAGMA journal_mode = WAL');
   ```
4. **Use indexes** on frequently queried columns
