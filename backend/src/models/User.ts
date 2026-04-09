import pool from '../utils/db';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export class UserModel {
  static async create(email: string, password: string): Promise<User | null> {
    try {
      const id = uuidv4();
      const password_hash = await bcryptjs.hash(password, 10);

      const result = await pool.query(
        'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [id, email, password_hash]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash);
  }
}