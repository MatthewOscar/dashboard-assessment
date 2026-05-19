// The sanctioned data path. All dashboard and API queries go through here.
//
// Backed by a local SQLite file (`data.db` at the project root). The seed
// script creates it; `pnpm dev` reads it. Both use the same `getDb()` handle
// below.
//
// Uses Node's built-in `node:sqlite` (stable in Node 22.5+) so there is no
// native compile step on `pnpm install`. Schema is documented in /schema.sql.

import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data.db");

let _db: DatabaseSync | null = null;

/**
 * Returns a singleton SQLite handle. Lazy so that `import`-time side effects
 * don't open a file before the seed has had a chance to create it.
 *
 * Configured with WAL journaling and foreign-key enforcement, both of which
 * are off by default in SQLite and surprise people.
 */
export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec("PRAGMA journal_mode = WAL");
    _db.exec("PRAGMA foreign_keys = ON");
  }
  return _db;
}

// ----- Row types -------------------------------------------------------------

export type AgentRow = {
  id: string;
  name: string;
  team: string;
  hire_date: string;
  created_at: string;
};

export type CallOutcome = "connected" | "voicemail" | "no_answer" | "busy" | "failed";

export type CallRow = {
  id: string;
  agent_id: string;
  customer_phone: string;
  started_at: string; // ISO 8601
  ended_at: string | null; // ISO 8601, null only for failed
  duration_seconds: number;
  outcome: CallOutcome;
  created_at: string;
};

// ----- Query Functions -------------------------------------------------------

/**
 * Get all agents with optional team filter
 */
export function getAgents(team?: string): AgentRow[] {
  const db = getDb();
  if (team) {
    return db.prepare("SELECT * FROM agents WHERE team = ? ORDER BY name").all(team) as AgentRow[];
  }
  return db.prepare("SELECT * FROM agents ORDER BY team, name").all() as AgentRow[];
}

/**
 * Get a single agent by ID
 */
export function getAgent(id: string): AgentRow | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM agents WHERE id = ?").get(id) as AgentRow) || null;
}

/**
 * Get all unique team names
 */
export function getTeams(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT DISTINCT team FROM agents ORDER BY team").all() as Array<{ team: string }>;
  return rows.map(r => r.team);
}

/**
 * Count connected calls in the last N days (rolling window from now)
 */
export function getConnectedCallsLastDays(days: number): number {
  const db = getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(
    "SELECT COUNT(*) as count FROM calls WHERE outcome = 'connected' AND started_at >= ?"
  ).get(cutoff) as { count: number };
  return result.count;
}

/**
 * Get daily call stats for the last N days (oldest first)
 */
export function getDailyStats(days: number): Array<{
  date: string;
  connected_count: number;
  total_count: number;
}> {
  const db = getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const rows = db.prepare(`
    SELECT 
      DATE(started_at) as date,
      SUM(CASE WHEN outcome = 'connected' THEN 1 ELSE 0 END) as connected_count,
      COUNT(*) as total_count
    FROM calls
    WHERE DATE(started_at) >= ?
    GROUP BY DATE(started_at)
    ORDER BY date ASC
  `).all(cutoff) as Array<{ date: string; connected_count: number; total_count: number }>;
  return rows;
}

/**
 * Get top 3 agents by connected calls in last 7 days
 */
export function getTopAgents(): Array<{
  id: string;
  name: string;
  team: string;
  connected_count: number;
}> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = db.prepare(`
    SELECT 
      a.id,
      a.name,
      a.team,
      COUNT(*) as connected_count
    FROM calls c
    JOIN agents a ON c.agent_id = a.id
    WHERE c.outcome = 'connected' AND c.started_at >= ?
    GROUP BY a.id
    ORDER BY connected_count DESC
    LIMIT 3
  `).all(cutoff) as Array<{ id: string; name: string; team: string; connected_count: number }>;
  return rows;
}

/**
 * Get daily stats for a specific agent (last 14 days)
 */
export function getAgentDailyStats(agentId: string): Array<{
  date: string;
  connected_count: number;
  total_count: number;
}> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const rows = db.prepare(`
    SELECT 
      DATE(started_at) as date,
      SUM(CASE WHEN outcome = 'connected' THEN 1 ELSE 0 END) as connected_count,
      COUNT(*) as total_count
    FROM calls
    WHERE agent_id = ? AND DATE(started_at) >= ?
    GROUP BY DATE(started_at)
    ORDER BY date ASC
  `).all(agentId, cutoff) as Array<{ date: string; connected_count: number; total_count: number }>;
  return rows;
}

/**
 * Get agent totals for last 7 and prior 7 days
 */
export function getAgentTotals(agentId: string): {
  connected_last_7: number;
  connected_prior_7: number;
  connect_rate_last_7: number;
} {
  const db = getDb();
  const now = Date.now();
  const cutoffLast7 = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const cutoffPrior7 = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

  const last7 = db.prepare(`
    SELECT 
      SUM(CASE WHEN outcome = 'connected' THEN 1 ELSE 0 END) as connected,
      COUNT(*) as total
    FROM calls
    WHERE agent_id = ? AND started_at >= ?
  `).get(agentId, cutoffLast7) as { connected: number; total: number };

  const prior7 = db.prepare(`
    SELECT 
      SUM(CASE WHEN outcome = 'connected' THEN 1 ELSE 0 END) as connected,
      COUNT(*) as total
    FROM calls
    WHERE agent_id = ? AND started_at >= ? AND started_at < ?
  `).get(agentId, cutoffPrior7, cutoffLast7) as { connected: number; total: number };

  return {
    connected_last_7: last7.connected || 0,
    connected_prior_7: prior7.connected || 0,
    connect_rate_last_7: last7.total > 0 ? (last7.connected || 0) / last7.total : 0,
  };
}

/**
 * Get team stats for the last 7 days
 */
export function getTeamStats(teamName: string): {
  connected_count: number;
  total_count: number;
  connect_rate: number;
} {
  const db = getDb();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const result = db.prepare(`
    SELECT 
      SUM(CASE WHEN c.outcome = 'connected' THEN 1 ELSE 0 END) as connected,
      COUNT(*) as total
    FROM calls c
    JOIN agents a ON c.agent_id = a.id
    WHERE a.team = ? AND c.started_at >= ?
  `).get(teamName, cutoff) as { connected: number; total: number };

  const connected = result.connected || 0;
  const total = result.total || 0;
  return {
    connected_count: connected,
    total_count: total,
    connect_rate: total > 0 ? connected / total : 0,
  };
}

/**
 * Get agent breakdown for a team (last 7 days)
 */
export function getTeamAgents(teamName: string): Array<{
  id: string;
  name: string;
  connected_count: number;
  total_count: number;
}> {
  const db = getDb();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const rows = db.prepare(`
    SELECT 
      a.id,
      a.name,
      SUM(CASE WHEN c.outcome = 'connected' THEN 1 ELSE 0 END) as connected_count,
      COUNT(*) as total_count
    FROM calls c
    JOIN agents a ON c.agent_id = a.id
    WHERE a.team = ? AND c.started_at >= ?
    GROUP BY a.id
    ORDER BY connected_count DESC
  `).all(teamName, cutoff) as Array<{
    id: string;
    name: string;
    connected_count: number;
    total_count: number;
  }>;
  
  return rows;
}

/**
 * Get team-level breakdown for a specific date
 */
export function getTeamsByDate(date: string): Array<{
  team: string;
  connected_count: number;
}> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT 
      a.team,
      SUM(CASE WHEN c.outcome = 'connected' THEN 1 ELSE 0 END) as connected_count
    FROM calls c
    JOIN agents a ON c.agent_id = a.id
    WHERE DATE(c.started_at) = ?
    GROUP BY a.team
    ORDER BY a.team
  `).all(date) as Array<{ team: string; connected_count: number }>;
  
  return rows;
}
