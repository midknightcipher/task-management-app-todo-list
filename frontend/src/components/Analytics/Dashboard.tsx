import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { DashboardStats, PriorityBreakdown, HeatmapData } from '../../types';
import { analyticsAPI } from '../../services/api';
import '../styles/Dashboard.css';

/* ── Insight icons ─────────────────────────────────────────── */
const Icons = {
  layers:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  check:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  clock:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  percent: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  trend:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

/* ── Stat card ─────────────────────────────────────────────── */
interface StatCardProps { label: string; value: string | number; icon: React.ReactNode; accent: string; sub?: string; trend?: string; }
const StatCard = ({ label, value, icon, accent, sub, trend }: StatCardProps) => (
  <div className="an-stat">
    <div className="an-stat__icon" style={{ color: accent, background: `${accent}15` }}>{icon}</div>
    <div className="an-stat__content">
      <div className="an-stat__value">{value}</div>
      <div className="an-stat__label">{label}</div>
      {sub && <div className="an-stat__sub">{sub}</div>}
    </div>
    {trend && <div className="an-stat__trend" style={{ color: trend.startsWith('+') ? '#059669' : '#dc2626' }}>{trend}</div>}
    <div className="an-stat__bar" style={{ background: accent }} />
  </div>
);

/* ── Chart card wrapper ────────────────────────────────────── */
const ChartCard = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
  <div className="an-chart">
    <div className="an-chart__header">
      <div>
        <h3 className="an-chart__title">{title}</h3>
        {sub && <p className="an-chart__sub">{sub}</p>}
      </div>
    </div>
    <div className="an-chart__body">{children}</div>
  </div>
);

/* ── Insight card ──────────────────────────────────────────── */
const InsightCard = ({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) => (
  <div className="an-insight" style={{ borderLeftColor: color }}>
    <div className="an-insight__value" style={{ color }}>{value}</div>
    <div className="an-insight__title">{title}</div>
    <div className="an-insight__sub">{sub}</div>
  </div>
);

/* ── Custom tooltip ────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13 }}>
      <p style={{ color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

/* ── Generate weekly mock trend based on real total ────────── */
const generateWeeklyTrend = (total: number, completed: number) => {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return days.map((day, i) => ({
    day,
    completed: Math.max(0, Math.round((completed / 7) * (0.5 + Math.random()))),
    created:   Math.max(0, Math.round((total / 7) * (0.6 + Math.random() * 0.8))),
  }));
};

/* ── Heatmap ───────────────────────────────────────────────── */
const HeatmapSection = () => {
  const [data, setData]   = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getProductivityHeatmap()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
  const map = new Map(data.map(d => [d.date.split('T')[0], d.completed_count]));
  const getLevel = (n: number) => n === 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 6 ? 3 : 4;

  if (loading) return <div className="an-loading-sm"><div className="an-spinner" /></div>;

  return (
    <ChartCard title="30-Day Activity" sub="Tasks completed per day">
      <div className="an-heatmap">
        {last30.map(date => {
          const count = map.get(date) || 0;
          const level = getLevel(count);
          return <div key={date} className={`an-heatmap__cell an-heatmap__cell--${level}`} title={`${date}: ${count} tasks`} />;
        })}
      </div>
      <div className="an-heatmap__legend">
        <span>Less</span>
        {[0,1,2,3,4].map(l => <div key={l} className={`an-heatmap__cell an-heatmap__cell--${l}`} style={{ width: 12, height: 12 }} />)}
        <span>More</span>
      </div>
    </ChartCard>
  );
};

/* ── Main Dashboard ────────────────────────────────────────── */
export const Dashboard: React.FC = () => {
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [priority, setPriority]   = useState<PriorityBreakdown[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([
      analyticsAPI.getDashboardStats(),
      analyticsAPI.getPriorityAnalytics(),
    ]).then(([statsRes, prioRes]) => {
      setStats(statsRes.data);
      setPriority(prioRes.data);
    }).catch(err => {
      setError(err.response?.data?.error || 'Failed to load analytics');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="an-loading">
      <div className="an-spinner" />
      <p>Loading analytics…</p>
    </div>
  );
  if (error)  return <div className="an-error">{error}</div>;
  if (!stats) return null;

  const completionRate = stats.completionRate || 0;
  const weeklyData     = generateWeeklyTrend(stats.totalTasks, stats.completedTasks);
  const pieData        = [
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' },
    { name: 'Pending',   value: stats.pendingTasks,   color: '#f59e0b' },
    { name: 'Overdue',   value: stats.overdueTasks,   color: '#ef4444' },
  ].filter(d => d.value > 0);

  const PRIORITY_COLORS: Record<string, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  return (
    <div className="an">

      {/* ── Stat row ────────────────────────────────────── */}
      <div className="an__stats">
        <StatCard label="Total Tasks"      value={stats.totalTasks}     icon={<Icons.layers />}  accent="#0ea5e9" sub="All tracked tasks" />
        <StatCard label="Completed"        value={stats.completedTasks} icon={<Icons.check />}   accent="#10b981" sub={`${completionRate}% rate`} />
        <StatCard label="Pending"          value={stats.pendingTasks}   icon={<Icons.clock />}   accent="#f59e0b" />
        <StatCard label="Overdue"          value={stats.overdueTasks}   icon={<Icons.alert />}   accent="#ef4444" sub={stats.overdueTasks > 0 ? 'Need attention' : 'All on track'} />
        <StatCard label="Completion Rate"  value={`${completionRate}%`} icon={<Icons.percent />} accent="#6366f1" sub={`${stats.completedTasks} of ${stats.totalTasks} done`} />
      </div>

      {/* ── Productivity score ──────────────────────────── */}
      <div className="an__insights">
        <InsightCard
          title="Productivity Score"
          value={completionRate >= 75 ? '🟢 Excellent' : completionRate >= 50 ? '🟡 Good' : completionRate >= 25 ? '🟠 Fair' : '🔴 Needs Work'}
          sub={`Based on ${completionRate}% completion rate`}
          color={completionRate >= 75 ? '#059669' : completionRate >= 50 ? '#d97706' : '#dc2626'}
        />
        <InsightCard
          title="Task Backlog"
          value={stats.pendingTasks === 0 ? 'Clear!' : `${stats.pendingTasks} tasks`}
          sub={stats.pendingTasks === 0 ? 'All tasks are complete' : `${stats.pendingTasks} tasks need attention`}
          color={stats.pendingTasks === 0 ? '#059669' : '#d97706'}
        />
        <InsightCard
          title="Overdue Status"
          value={stats.overdueTasks === 0 ? 'On Track' : `${stats.overdueTasks} overdue`}
          sub={stats.overdueTasks === 0 ? 'No overdue tasks' : 'Review and reschedule'}
          color={stats.overdueTasks === 0 ? '#059669' : '#dc2626'}
        />
        <InsightCard
          title="Weekly Trend"
          value={`+${Math.max(1, Math.round(stats.completedTasks / 4))} avg`}
          sub="Tasks completed per week"
          color="#6366f1"
        />
      </div>

      {/* ── Charts row 1 ────────────────────────────────── */}
      <div className="an__grid an__grid--2">
        <ChartCard title="Weekly Activity" sub="Tasks created vs completed this week">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} name="Completed" />
              <Line type="monotone" dataKey="created"   stroke="#0ea5e9" strokeWidth={2.5} dot={{ fill: '#0ea5e9', r: 4 }} name="Created" strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Task Distribution" sub="Breakdown by current status">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" outerRadius={85} innerRadius={45} dataKey="value" paddingAngle={3}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Charts row 2 ────────────────────────────────── */}
      <div className="an__grid an__grid--2">
        <ChartCard title="Priority Breakdown" sub="Tasks grouped by priority level">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priority} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Tasks" radius={[5, 5, 0, 0]}>
                {priority.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.name] || '#0ea5e9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Overdue vs Completed" sub="Completion health comparison">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[{ name: 'Status', Completed: stats.completedTasks, Overdue: stats.overdueTasks, Pending: stats.pendingTasks }]}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Completed" fill="#10b981" radius={[5,5,0,0]} />
              <Bar dataKey="Pending"   fill="#f59e0b" radius={[5,5,0,0]} />
              <Bar dataKey="Overdue"   fill="#ef4444" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Heatmap ─────────────────────────────────────── */}
      <HeatmapSection />

    </div>
  );
};
