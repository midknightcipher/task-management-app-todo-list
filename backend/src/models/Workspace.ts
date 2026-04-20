import pool from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  email?: string;
  created_at: Date;
}

export class WorkspaceModel {
  static async create(name: string, ownerId: string): Promise<Workspace | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const wsId = uuidv4();
      const wsResult = await client.query(
        `INSERT INTO workspaces (id, name, owner_id) VALUES ($1, $2, $3) RETURNING *`,
        [wsId, name, ownerId]
      );

      await client.query(
        `INSERT INTO workspace_members (id, workspace_id, user_id, role)
         VALUES ($1, $2, $3, 'owner')`,
        [uuidv4(), wsId, ownerId]
      );

      await client.query('COMMIT');
      return wsResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating workspace:', error);
      return null;
    } finally {
      client.release();
    }
  }

  static async findByUserId(userId: string): Promise<Workspace[]> {
    try {
      const result = await pool.query(
        `SELECT w.* FROM workspaces w
         JOIN workspace_members wm ON w.id = wm.workspace_id
         WHERE wm.user_id = $1
         ORDER BY w.created_at ASC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding workspaces:', error);
      return [];
    }
  }

  static async findById(workspaceId: string): Promise<Workspace | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM workspaces WHERE id = $1`,
        [workspaceId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding workspace:', error);
      return null;
    }
  }

  static async isMember(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
        [workspaceId, userId]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  static async getMemberRole(workspaceId: string, userId: string): Promise<string | null> {
    try {
      const result = await pool.query(
        `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
        [workspaceId, userId]
      );
      return result.rows[0]?.role || null;
    } catch (error) {
      console.error('Error getting member role:', error);
      return null;
    }
  }

  static async addMember(
    workspaceId: string,
    userId: string,
    role: string = 'member'
  ): Promise<WorkspaceMember | null> {
    try {
      const result = await pool.query(
        `INSERT INTO workspace_members (id, workspace_id, user_id, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role
         RETURNING *`,
        [uuidv4(), workspaceId, userId, role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding member:', error);
      return null;
    }
  }

  static async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const result = await pool.query(
        `SELECT wm.*, u.email
         FROM workspace_members wm
         JOIN users u ON wm.user_id = u.id
         WHERE wm.workspace_id = $1
         ORDER BY
           CASE wm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
           u.email ASC`,
        [workspaceId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting members:', error);
      return [];
    }
  }
}
