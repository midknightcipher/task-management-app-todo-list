import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { DashboardStats, HeatmapData, Task, Workspace } from '../../types';
import { analyticsAPI, tasksAPI, workspaceAPI } from '../../services/api';
import '../styles/Dashboard.css';

/* ── Icons ─────────────────────────────────────────────────── */
const Icons = {
  layers:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  check:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  users:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  alert:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  percent:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  timer:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  activity:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  database:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>,
  heart:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
};

/* ── Legacy function (kept for the Weekly Line Chart) ──────── */
function deriveWeeklyData(tasks: Task[]) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const created = tasks.filter(t => new Date(t.created_at) >= dayStart && new Date(t.created_at) < dayEnd).length;
    const completed = tasks.filter(t => t.completed_at && new Date(t.completed_at) >= dayStart && new Date(t.completed_at) < dayEnd).length;

    return { day, created, completed };
  });
}

/* ── Shared UI components ───────────────────────────────────── */
const StatCard = ({ label, value, icon, accent, sub }: any) => (
  <div className="an-stat">
    <div className="an-stat__icon" style={{ color: accent, background: `${accent}18` }}>{icon}</div>
    <div className="an-stat__content">
      <div className="an-stat__value">{value}</div>
      <div className="an-stat__label">{label}</div>
      {sub && <div className="an-stat__sub">{sub}</div>}
    </div>
    <div className="an-stat__bar" style={{ background: accent }} />
  </div>
);

const ChartCard = ({ title, sub, children }: any) => (
  <div className="an-chart">
    <div className="an-chart__header">
      <h3 className="an-chart__title">{title}</h3>
      {sub && <p className="an-chart__sub">{sub}</p>}
    </div>
    <div className="an-chart__body">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}>
      <p style={{ color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Heatmap Component (Kept exactly as requested) ──────────── */
const HeatmapSection = ({ workspaceId }: { workspaceId: string }) => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getProductivityHeatmap(workspaceId || undefined)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const last35 = useMemo(() => Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    return d.toISOString().split('T')[0];
  }), []);

  const countMap = useMemo(() => new Map(data.map(d => [d.date.split('T')[0], d.completed_count])), [data]);
  const getLevel = (n: number) => n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;

  if (loading) return <ChartCard title="30-Day Activity" sub="Tasks completed per day"><div className="an-loading-sm"><div className="an-spinner" /></div></ChartCard>;

  return (
    <ChartCard title="30-Day Activity" sub="Tasks completed per day">
      <div className="an-heatmap">
        {last35.map(date => {
          const count = countMap.get(date) || 0;
          return <div key={date} className={`an-heatmap__cell an-heatmap__cell--${getLevel(count)}`} title={`${date}: ${count} completed`} />;
        })}
      </div>
      <div className="an-heatmap__legend">
        <span className="an-heatmap__legend-text">Less</span>
        {[0, 1, 2, 3, 4].map(l => <div key={l} className={`an-heatmap__cell an-heatmap__cell--${l} an-heatmap__cell--sm`} />)}
        <span className="an-heatmap__legend-text">More</span>
      </div>
    </ChartCard>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN ANALYTICS DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
export const Dashboard: React.FC = () => {
  // UI State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  
  // Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Polling logic for Near Real-Time feel
  useEffect(() => {
    const fetchData = () => {
      const wsParam = selectedWorkspace || undefined;
      Promise.all([
        analyticsAPI.getDashboardStats(wsParam),
        workspaceAPI.getAll(),
        tasksAPI.getAll(undefined, undefined, wsParam)
      ]).then(([statsRes, wsRes, tasksRes]) => {
        setStats(statsRes.data);
        setWorkspaces(wsRes.data || []);
        setTasks(tasksRes.data || []);
      }).finally(() => setLoading(false));
    };

    fetchData();
    // Poll the fast ETL endpoints every 30 seconds
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, [selectedWorkspace]);

  const weeklyData = useMemo(() => deriveWeeklyData(tasks), [tasks]);

  if (loading && !stats) return <div className="an-loading"><div className="an-spinner" /><p>Loading ETL Analytics…</p></div>;
  if (!stats) return <div className="an-error">Failed to load analytics</div>;

  return (
    <div className="an">
      {/* Scope Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', margin: 0 }}>Analytics Scope:</h2>
        <select 
          value={selectedWorkspace} 
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
        >
          <option value="">Personal Data</option>
          {workspaces.map(ws => <option key={ws.id} value={ws.id}>{ws.name} Team</option>)}
        </select>
      </div>

      {/* TOP SECTION: KPI Cards (Driven strictly by the ETL payload) */}
      <div className="an__stats">
        {stats.mode === 'personal' ? (
          <>
            <StatCard label="Tasks Completed" value={stats.tasksCompleted} icon={<Icons.check />} accent="#10b981" sub={`Out of ${stats.tasksCreated} created`} />
            <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={<Icons.percent />} accent="#0ea5e9" />
            <StatCard label="Productivity Score" value={stats.productivityScore} icon={<Icons.activity />} accent="#8b5cf6" sub="Calculated via ETL" />
            <StatCard label="Overdue Tasks" value={stats.overdueTasks} icon={<Icons.alert />} accent="#ef4444" />
          </>
        ) : (
          <>
            <StatCard label="Workspace Health" value={`${stats.healthScore}/100`} icon={<Icons.heart />} accent={stats.healthScore > 80 ? '#10b981' : '#f59e0b'} sub="Based on overdue rates" />
            <StatCard label="Total Tasks" value={stats.totalTasks} icon={<Icons.layers />} accent="#0ea5e9" sub={`${stats.completedTasks} completed`} />
            <StatCard label="Active Members" value={stats.activeMembers} icon={<Icons.users />} accent="#8b5cf6" />
            <StatCard label="Overdue Tasks" value={stats.overdueTasks} icon={<Icons.alert />} accent={stats.overdueTasks > 0 ? '#ef4444' : '#10b981'} />
          </>
        )}
      </div>

      {/* MIDDLE SECTION: Weekly Activity + Team Leaderboard */}
      <div className="an__grid an__grid--2">
        <ChartCard title="Weekly Activity" sub="Operational tasks created vs completed">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Completed" />
              <Line type="monotone" dataKey="created" stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: '#0ea5e9', r: 4 }} name="Created" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>



        {/* Updated Productivity Intelligence using ETL data directly */}
        <ChartCard title="Productivity Intelligence" sub="Pipeline-calculated performance indicators">
           <div className="an__productivity" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: '100%' }}>
              {stats.mode === 'personal' ? (
                <>
                  <div className="an-pi-card" style={{ borderTopColor: '#8b5cf6', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 600 }}>{stats.productivityScore}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Overall Score</div>
                  </div>
                  <div className="an-pi-card" style={{ borderTopColor: '#ef4444', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ color: '#ef4444', fontSize: '24px', fontWeight: 600 }}>{stats.overdueTasks}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Overdue Tasks</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="an-pi-card" style={{ borderTopColor: stats.healthScore > 80 ? '#10b981' : '#f59e0b', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ color: stats.healthScore > 80 ? '#10b981' : '#f59e0b', fontSize: '24px', fontWeight: 600 }}>{stats.healthScore}/100</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Team Health</div>
                  </div>
                  <div className="an-pi-card" style={{ borderTopColor: '#0ea5e9', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ color: '#0ea5e9', fontSize: '24px', fontWeight: 600 }}>{stats.completedTasks}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Tasks Shipped</div>
                  </div>
                </>
              )}
           </div>
        </ChartCard>
      </div>

      {/* BOTTOM SECTION: Heatmap + Pipeline Infrastructure Widget */}
      <HeatmapSection workspaceId={selectedWorkspace} />
    </div>
  );
};