// Database module for SQLite
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'clintonville.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database and create tables
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          active INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }

        // Add new columns if they don't exist (migration)
        this.migrateUsersTable().then(() => {
          // Properties table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS properties (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              address TEXT NOT NULL,
              zoning TEXT,
              value REAL,
              notes TEXT,
              tax_value REAL,
              assessed_value REAL,
              cap_rate REAL,
              monthly_payment REAL,
              coordinates TEXT,
              thumbs_up INTEGER DEFAULT 0,
              thumbs_down INTEGER DEFAULT 0,
              created_by INTEGER,
              created_by_name TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating properties table:', err);
              reject(err);
              return;
            }

            // Migrate properties table to add new columns if needed
            this.migratePropertiesTable().then(() => {
              // Create default admin user if it doesn't exist
              this.createDefaultAdmin().then(resolve).catch(reject);
            }).catch(reject);
          });
        }).catch(reject);
      });
    });
  }

  async migratePropertiesTable() {
    return new Promise((resolve, reject) => {
      this.db.all(`PRAGMA table_info(properties)`, [], (err, existingColumns) => {
        if (err) {
          console.error('Error checking properties table info:', err);
          reject(err);
          return;
        }

        const columnNames = existingColumns.map(col => col.name);
        const columnsToAdd = [
          { name: 'assessed_value', type: 'REAL' },
          { name: 'cap_rate', type: 'REAL' },
          { name: 'monthly_payment', type: 'REAL' },
          { name: 'created_by', type: 'INTEGER' },
          { name: 'created_by_name', type: 'TEXT' }
        ];

        const missingColumns = columnsToAdd.filter(col => !columnNames.includes(col.name));

        if (missingColumns.length === 0) {
          resolve();
          return;
        }

        // Add missing columns
        const addColumnPromises = missingColumns.map(col => {
          return new Promise((resolveCol, rejectCol) => {
            const unique = col.unique ? ' UNIQUE' : '';
            this.db.run(
              `ALTER TABLE properties ADD COLUMN ${col.name} ${col.type}${unique}`,
              (err) => {
                if (err) {
                  console.error(`Error adding column ${col.name}:`, err);
                  rejectCol(err);
                } else {
                  console.log(`Added column ${col.name} to properties table`);
                  resolveCol();
                }
              }
            );
          });
        });

        Promise.all(addColumnPromises).then(() => resolve()).catch(reject);
      });
    });
  }

  async migrateUsersTable() {
    return new Promise((resolve, reject) => {
      // Check if columns exist and add them if they don't
      this.db.all(`PRAGMA table_info(users)`, [], (err, existingColumns) => {
        if (err) {
          console.error(`Error checking table info:`, err);
          reject(err);
          return;
        }

        const columnNames = existingColumns.map(col => col.name);
        const columnsToAdd = [
          { name: 'username', type: 'TEXT', unique: true },
          { name: 'first_name', type: 'TEXT', unique: false },
          { name: 'last_name', type: 'TEXT', unique: false }
        ];

        const missingColumns = columnsToAdd.filter(col => !columnNames.includes(col.name));

        if (missingColumns.length === 0) {
          // Check if unique index exists for username
          this.db.all(`SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users'`, [], (indexErr, indexes) => {
            if (indexErr) {
              console.error(`Error checking indexes:`, indexErr);
              resolve(); // Don't fail if we can't check indexes
              return;
            }
            const indexNames = indexes.map(idx => idx.name);
            if (!indexNames.includes('idx_users_username')) {
              // Create unique index for username
              this.db.run(
                `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
                (idxErr) => {
                  if (idxErr && !idxErr.message.includes('already exists')) {
                    console.error(`Error creating username index:`, idxErr);
                  } else {
                    console.log(`Created unique index on username`);
                  }
                  resolve();
                }
              );
            } else {
              resolve();
            }
          });
          return;
        }

        let completed = 0;
        const total = missingColumns.length;

        missingColumns.forEach((column) => {
          // Add column without UNIQUE constraint (SQLite doesn't support it in ALTER TABLE)
          this.db.run(
            `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`,
            (alterErr) => {
              if (alterErr) {
                // Ignore error if column already exists (race condition)
                if (!alterErr.message.includes('duplicate column name')) {
                  console.error(`Error adding column ${column.name}:`, alterErr);
                  reject(alterErr);
                  return;
                }
              } else {
                console.log(`Added column ${column.name} to users table`);
                
                // If this is the username column, create a unique index
                if (column.name === 'username' && column.unique) {
                  this.db.run(
                    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
                    (idxErr) => {
                      if (idxErr && !idxErr.message.includes('already exists')) {
                        console.error(`Error creating username index:`, idxErr);
                      } else {
                        console.log(`Created unique index on username`);
                      }
                    }
                  );
                }
              }
              completed++;
              if (completed === total) {
                resolve();
              }
            }
          );
        });
      });
    });
  }

  async createDefaultAdmin() {
    return new Promise((resolve, reject) => {
      // Check if admin exists
      this.db.get('SELECT * FROM users WHERE email = ?', ['admin@clintonville.com'], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          // Create default admin with password "admin123"
          const passwordHash = await bcrypt.hash('admin123', 10);
          this.db.run(
            'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
            ['admin@clintonville.com', 'Admin User', passwordHash, 'admin'],
            (err) => {
              if (err) {
                console.error('Error creating default admin:', err);
                reject(err);
                return;
              }
              console.log('Default admin user created: admin@clintonville.com / admin123');
              resolve();
            }
          );
        } else {
          resolve();
        }
      });
    });
  }

  // User methods
  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE email = ? AND active = 1', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id, email, name, username, first_name, last_name, role, created_at, updated_at, active FROM users WHERE id = ? AND active = 1', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, email, name, username, first_name, last_name, role, created_at, updated_at, active FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async createUser(email, name, password, role = 'viewer', username = null, firstName = null, lastName = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        this.db.run(
          'INSERT INTO users (email, name, password_hash, role, username, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [email, name, passwordHash, role, username, firstName, lastName],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint')) {
                if (err.message.includes('username')) {
                  reject(new Error('User with this username already exists'));
                } else {
                  reject(new Error('User with this email already exists'));
                }
              } else {
                reject(err);
              }
              return;
            }
            // Return user without password
            this.db.get('SELECT id, email, name, username, first_name, last_name, role, created_at, active FROM users WHERE id = ?', [this.lastID], (err, user) => {
              if (err) reject(err);
              else resolve(user);
            });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async updateUser(id, updates) {
    return new Promise(async (resolve, reject) => {
      const fields = [];
      const values = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      if (updates.username !== undefined) {
        fields.push('username = ?');
        values.push(updates.username);
      }
      if (updates.first_name !== undefined) {
        fields.push('first_name = ?');
        values.push(updates.first_name);
      }
      if (updates.last_name !== undefined) {
        fields.push('last_name = ?');
        values.push(updates.last_name);
      }
      if (updates.role !== undefined) {
        fields.push('role = ?');
        values.push(updates.role);
      }
      if (updates.password !== undefined) {
        const passwordHash = await bcrypt.hash(updates.password, 10);
        fields.push('password_hash = ?');
        values.push(passwordHash);
      }
      if (updates.active !== undefined) {
        fields.push('active = ?');
        values.push(updates.active ? 1 : 0);
      }

      if (fields.length === 0) {
        resolve(null);
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

      this.db.run(sql, values, function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            if (err.message.includes('username')) {
              reject(new Error('User with this username already exists'));
            } else {
              reject(new Error('User with this email already exists'));
            }
          } else {
            reject(err);
          }
          return;
        }
        // Return updated user
        database.getUserById(id).then(resolve).catch(reject);
      });
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      // Soft delete - set active to 0
      this.db.run('UPDATE users SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ success: true, id });
      });
    });
  }

  async verifyPassword(email, password) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT password_hash FROM users WHERE email = ? AND active = 1', [email], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve(false);
          return;
        }
        const isValid = await bcrypt.compare(password, row.password_hash);
        resolve(isValid);
      });
    });
  }

  // Property methods
  async getAllProperties() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
          id, address, zoning, value, notes, tax_value, assessed_value, cap_rate, monthly_payment,
          coordinates, thumbs_up, thumbs_down, created_by, created_by_name,
          created_at, updated_at
        FROM properties 
        ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            // Transform database format to API format
            const properties = (rows || []).map(row => ({
              id: row.id,
              address: row.address,
              zoning: row.zoning,
              value: row.value,
              notes: row.notes || '',
              taxValue: row.tax_value,
              assessedValue: row.assessed_value,
              capRate: row.cap_rate,
              monthlyPayment: row.monthly_payment,
              position: row.coordinates ? JSON.parse(row.coordinates) : null,
              coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
              thumbsUp: row.thumbs_up || 0,
              thumbsDown: row.thumbs_down || 0,
              createdBy: row.created_by,
              createdByName: row.created_by_name,
              lastUpdated: row.updated_at || row.created_at
            }));
            resolve(properties);
          }
        }
      );
    });
  }

  async getPropertyById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
          id, address, zoning, value, notes, tax_value, assessed_value, cap_rate, monthly_payment,
          coordinates, thumbs_up, thumbs_down, created_by, created_by_name,
          created_at, updated_at
        FROM properties 
        WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (!row) {
            resolve(null);
          } else {
            const property = {
              id: row.id,
              address: row.address,
              zoning: row.zoning,
              value: row.value,
              notes: row.notes || '',
              taxValue: row.tax_value,
              assessedValue: row.assessed_value,
              capRate: row.cap_rate,
              monthlyPayment: row.monthly_payment,
              position: row.coordinates ? JSON.parse(row.coordinates) : null,
              coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
              thumbsUp: row.thumbs_up || 0,
              thumbsDown: row.thumbs_down || 0,
              createdBy: row.created_by,
              createdByName: row.created_by_name,
              lastUpdated: row.updated_at || row.created_at
            };
            resolve(property);
          }
        }
      );
    });
  }

  async createProperty(property) {
    const self = this;
    return new Promise((resolve, reject) => {
      const coordinates = property.coordinates || property.position;
      const coordinatesJson = coordinates ? JSON.stringify(coordinates) : null;

      self.db.run(
        `INSERT INTO properties (
          address, zoning, value, notes, tax_value, assessed_value, cap_rate, monthly_payment,
          coordinates, thumbs_up, thumbs_down, created_by, created_by_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          property.address,
          property.zoning || 'Residential',
          property.value || 200000,
          property.notes || '',
          property.taxValue || null,
          property.assessedValue || null,
          property.capRate || null,
          property.monthlyPayment || null,
          coordinatesJson,
          property.thumbsUp || 0,
          property.thumbsDown || 0,
          property.createdBy || null,
          property.createdByName || null
        ],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          // Return the created property
          self.getPropertyById(this.lastID).then(resolve).catch(reject);
        }
      );
    });
  }

  async updateProperty(id, updates) {
    const self = this;
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];

      if (updates.address !== undefined) {
        fields.push('address = ?');
        values.push(updates.address);
      }
      if (updates.zoning !== undefined) {
        fields.push('zoning = ?');
        values.push(updates.zoning);
      }
      if (updates.value !== undefined) {
        fields.push('value = ?');
        values.push(updates.value);
      }
      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.taxValue !== undefined) {
        fields.push('tax_value = ?');
        values.push(updates.taxValue);
      }
      if (updates.assessedValue !== undefined) {
        fields.push('assessed_value = ?');
        values.push(updates.assessedValue);
      }
      if (updates.capRate !== undefined) {
        fields.push('cap_rate = ?');
        values.push(updates.capRate);
      }
      if (updates.monthlyPayment !== undefined) {
        fields.push('monthly_payment = ?');
        values.push(updates.monthlyPayment);
      }
      if (updates.coordinates !== undefined || updates.position !== undefined) {
        const coords = updates.coordinates || updates.position;
        fields.push('coordinates = ?');
        values.push(coords ? JSON.stringify(coords) : null);
      }
      if (updates.thumbsUp !== undefined) {
        fields.push('thumbs_up = ?');
        values.push(updates.thumbsUp);
      }
      if (updates.thumbsDown !== undefined) {
        fields.push('thumbs_down = ?');
        values.push(updates.thumbsDown);
      }

      if (fields.length === 0) {
        // No updates, return current property
        self.getPropertyById(id).then(resolve).catch(reject);
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const sql = `UPDATE properties SET ${fields.join(', ')} WHERE id = ?`;

      self.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
          return;
        }
        // Return updated property
        self.getPropertyById(id).then(resolve).catch(reject);
      });
    });
  }

  async deleteProperty(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM properties WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, deleted: this.changes > 0 });
        }
      });
    });
  }

  async deleteAllProperties() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM properties', [], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ count: this.changes });
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();


