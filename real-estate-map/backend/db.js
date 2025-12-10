// Database module for PostgreSQL
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Use private DATABASE_URL to avoid egress fees
// DATABASE_URL is the private/internal connection (no fees)
// DATABASE_PUBLIC_URL is public and incurs egress fees - DO NOT USE
const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL or DATABASE_PRIVATE_URL must be set!');
  console.error('Using DATABASE_PUBLIC_URL will incur egress fees.');
  console.error('Please use the private DATABASE_URL from your PostgreSQL service variables.');
}

// Create connection pool with better timeout settings
const pool = new Pool({
  connectionString: connectionString,
  // SSL is required for Railway PostgreSQL connections
  ssl: connectionString?.includes('railway') || connectionString?.includes('railway.app') || connectionString?.includes('railway.internal') 
    ? { rejectUnauthorized: false } 
    : false,
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000,
  max: 10
});

class Database {
  constructor() {
    this.pool = pool;
  }

  // Initialize database and create tables with retry logic
  async initialize(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        // Test connection
        await this.pool.query('SELECT NOW()');
        console.log('✅ Connected to PostgreSQL database');
        
        await this.createTables();
        return; // Success, exit retry loop
      } catch (error) {
        const isLastAttempt = i === retries - 1;
        
        if (isLastAttempt) {
          console.error('❌ Error initializing database after', retries, 'attempts:', error.message);
          console.error('Connection details:', {
            host: error.address || 'unknown',
            port: error.port || 'unknown',
            code: error.code,
            errno: error.errno
          });
          throw error;
        }
        
        console.warn(`⚠️  Database connection attempt ${i + 1}/${retries} failed. Retrying in ${delay}ms...`);
        console.warn('Error:', error.message);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * 1.5, 10000); // Increase delay, max 10 seconds
      }
    }
  }

  async createTables() {
    try {
      // Users table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer',
          username TEXT UNIQUE,
          first_name TEXT,
          last_name TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          active INTEGER DEFAULT 1
        )
      `);

      // Create unique index for username if it doesn't exist
      await this.pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)
        WHERE username IS NOT NULL
      `);

      // Properties table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS properties (
          id SERIAL PRIMARY KEY,
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Feature requests table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS feature_requests (
          id SERIAL PRIMARY KEY,
          description TEXT NOT NULL,
          user_email TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create default admin user if it doesn't exist
      await this.createDefaultAdmin();
      
      console.log('Database tables created/verified successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async createDefaultAdmin() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1',
        ['admin@clintonville.com']
      );

      if (result.rows.length === 0) {
        // Create default admin with password "admin123"
        const passwordHash = await bcrypt.hash('admin123', 10);
        await this.pool.query(
          'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
          ['admin@clintonville.com', 'Admin User', passwordHash, 'admin']
        );
        console.log('Default admin user created: admin@clintonville.com / admin123');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
      throw error;
    }
  }

  // User methods
  async getUserByEmail(email) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1 AND active = 1',
      [email]
    );
    return result.rows[0] || null;
  }

  async getUserById(id) {
    const result = await this.pool.query(
      'SELECT id, email, name, username, first_name, last_name, role, created_at, updated_at, active FROM users WHERE id = $1 AND active = 1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getAllUsers() {
    const result = await this.pool.query(
      'SELECT id, email, name, username, first_name, last_name, role, created_at, updated_at, active FROM users ORDER BY created_at DESC'
    );
    return result.rows || [];
  }

  async createUser(email, name, password, role = 'viewer', username = null, firstName = null, lastName = null) {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await this.pool.query(
        'INSERT INTO users (email, name, password_hash, role, username, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, name, username, first_name, last_name, role, created_at, active',
        [email, name, passwordHash, role, username, firstName, lastName]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint === 'users_username_key' || error.constraint === 'idx_users_username') {
          throw new Error('User with this username already exists');
        } else {
          throw new Error('User with this email already exists');
        }
      }
      throw error;
    }
  }

  async updateUser(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(updates.last_name);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${paramIndex++}`);
      values.push(updates.role);
    }
    if (updates.password !== undefined) {
      const passwordHash = await bcrypt.hash(updates.password, 10);
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${paramIndex++}`);
      values.push(updates.active ? 1 : 0);
    }

    if (fields.length === 0) {
      return await this.getUserById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

    try {
      await this.pool.query(sql, values);
      return await this.getUserById(id);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint === 'users_username_key' || error.constraint === 'idx_users_username') {
          throw new Error('User with this username already exists');
        } else {
          throw new Error('User with this email already exists');
        }
      }
      throw error;
    }
  }

  async deleteUser(id) {
    // Soft delete - set active to 0
    await this.pool.query(
      'UPDATE users SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    return { success: true, id };
  }

  async verifyPassword(email, password) {
    const result = await this.pool.query(
      'SELECT password_hash FROM users WHERE email = $1 AND active = 1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    const isValid = await bcrypt.compare(password, result.rows[0].password_hash);
    return isValid;
  }

  // Property methods
  async getAllProperties() {
    const result = await this.pool.query(
      `SELECT 
        id, address, zoning, value, notes, tax_value, assessed_value, cap_rate, monthly_payment,
        coordinates, thumbs_up, thumbs_down, created_by, created_by_name,
        created_at, updated_at
      FROM properties 
      ORDER BY created_at DESC`
    );
    
    // Transform database format to API format
    return result.rows.map(row => ({
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
  }

  async getPropertyById(id) {
    const result = await this.pool.query(
      `SELECT 
        id, address, zoning, value, notes, tax_value, assessed_value, cap_rate, monthly_payment,
        coordinates, thumbs_up, thumbs_down, created_by, created_by_name,
        created_at, updated_at
      FROM properties 
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
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
  }

  async createProperty(property) {
    const coordinates = property.coordinates || property.position;
    const coordinatesJson = coordinates ? JSON.stringify(coordinates) : null;

    const result = await this.pool.query(
      `INSERT INTO properties (
        address, zoning, value, notes, tax_value, assessed_value, cap_rate, monthly_payment,
        coordinates, thumbs_up, thumbs_down, created_by, created_by_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
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
      ]
    );
    
    const newId = result.rows[0].id;
    return await this.getPropertyById(newId);
  }

  async updateProperty(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(updates.address);
    }
    if (updates.zoning !== undefined) {
      fields.push(`zoning = $${paramIndex++}`);
      values.push(updates.zoning);
    }
    if (updates.value !== undefined) {
      fields.push(`value = $${paramIndex++}`);
      values.push(updates.value);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.taxValue !== undefined) {
      fields.push(`tax_value = $${paramIndex++}`);
      values.push(updates.taxValue);
    }
    if (updates.assessedValue !== undefined) {
      fields.push(`assessed_value = $${paramIndex++}`);
      values.push(updates.assessedValue);
    }
    if (updates.capRate !== undefined) {
      fields.push(`cap_rate = $${paramIndex++}`);
      values.push(updates.capRate);
    }
    if (updates.monthlyPayment !== undefined) {
      fields.push(`monthly_payment = $${paramIndex++}`);
      values.push(updates.monthlyPayment);
    }
    if (updates.coordinates !== undefined || updates.position !== undefined) {
      const coords = updates.coordinates || updates.position;
      fields.push(`coordinates = $${paramIndex++}`);
      values.push(coords ? JSON.stringify(coords) : null);
    }
    if (updates.thumbsUp !== undefined) {
      fields.push(`thumbs_up = $${paramIndex++}`);
      values.push(updates.thumbsUp);
    }
    if (updates.thumbsDown !== undefined) {
      fields.push(`thumbs_down = $${paramIndex++}`);
      values.push(updates.thumbsDown);
    }

    if (fields.length === 0) {
      return await this.getPropertyById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `UPDATE properties SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

    await this.pool.query(sql, values);
    return await this.getPropertyById(id);
  }

  async deleteProperty(id) {
    const result = await this.pool.query('DELETE FROM properties WHERE id = $1', [id]);
    return { id, deleted: result.rowCount > 0 };
  }

  async deleteAllProperties() {
    const result = await this.pool.query('DELETE FROM properties');
    return { count: result.rowCount };
  }

  // Feature request methods
  async createFeatureRequest(description, userEmail) {
    const result = await this.pool.query(
      'INSERT INTO feature_requests (description, user_email) VALUES ($1, $2) RETURNING id, description, user_email, status, created_at',
      [description, userEmail || null]
    );
    return result.rows[0];
  }

  async getAllFeatureRequests() {
    const result = await this.pool.query(
      'SELECT id, description, user_email, status, created_at, updated_at FROM feature_requests ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async getFeatureRequestById(id) {
    const result = await this.pool.query(
      'SELECT id, description, user_email, status, created_at, updated_at FROM feature_requests WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateFeatureRequestStatus(id, status) {
    const result = await this.pool.query(
      'UPDATE feature_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, description, user_email, status, created_at, updated_at',
      [status, id]
    );
    return result.rows[0] || null;
  }

  async deleteFeatureRequest(id) {
    const result = await this.pool.query('DELETE FROM feature_requests WHERE id = $1', [id]);
    return { id, deleted: result.rowCount > 0 };
  }

  async close() {
    await this.pool.end();
    console.log('Database connection pool closed');
  }
}

module.exports = new Database();
