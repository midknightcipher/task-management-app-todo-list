import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { DashboardStats, PriorityBreakdown, HeatmapData, Task } from '../../types';
import { analyticsAPI, tasksAPI } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import '../styles/Dashboard.css';

/* ── Icons ─────────────────────────────────────────────────── */
const Icons = {
  layers:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  check:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  clock:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  percent:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  target:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  timer:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  trendUp:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════
   DATA DERIVATION
   ═══════════════════════════════════════════════════════════════ */

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

    const created = tasks.filter(t => {
      const d = new Date(t.created_at);
      return d >= dayStart && d < dayEnd;
    }).length;

    const completed = tasks.filter(t => {
      if (!t.completed_at) return false;
      const d = new Date(t.completed_at);
      return d >= dayStart && d < dayEnd;
    }).length;

    return { day, created, completed };
  });
}

function deriveProductivityInsights(tasks: Task[]) {
  const now = new Date();

  const completedWithDue = tasks.filter(
    t => t.status === 'Completed' && t.completed_at && t.due_date
  );
  const completedOnTime = completedWithDue.filter(
    t => new Date(t.completed_at!) <= new Date(t.due_date!)
  );

  const overdueIncomplete = tasks.filter(
    t => t.due_date && t.status !== 'Completed' && new Date(t.due_date) < now
  );
  const accountable = completedWithDue.length + overdueIncomplete.length;
  const onTimeRate =
    accountable > 0
      ? Math.round((completedOnTime.length / accountable) * 100)
      : null;

  const overdueCount = tasks.filter(
    t => t.due_date && t.status !== 'Completed' && new Date(t.due_date) < now
  ).length;

  const completedTasks = tasks.filter(t => t.status === 'Completed' && t.completed_at);
  const avgDays =
    completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((sum, t) => {
            const ms =
              new Date(t.completed_at!).getTime() - new Date(t.created_at).getTime();
            return sum + ms / 86_400_000;
          }, 0) / completedTasks.length
        )
      : null;

  const weekAgo     = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14);

  const thisWeekDone = completedTasks.filter(
    t => new Date(t.completed_at!) >= weekAgo
  ).length;
  const lastWeekDone = completedTasks.filter(t => {
    const d = new Date(t.completed_at!);
    return d >= twoWeeksAgo && d < weekAgo;
  }).length;

  const trend: 'improving' | 'declining' | 'stable' | 'no data' =
    lastWeekDone === 0 && thisWeekDone === 0 ? 'no data'
    : lastWeekDone === 0                     ? 'improving'
    : thisWeekDone > lastWeekDone            ? 'improving'
    : thisWeekDone < lastWeekDone            ? 'declining'
    : 'stable';

  return { onTimeRate, overdueCount, avgDays, trend, thisWeekDone, lastWeekDone };
}

/* ── Shared UI components ───────────────────────────────────── */

const StatCard = ({
  label, value, icon, accent, sub,
}: {
  label: string; value: string | number;
  icon: React.ReactNode; accent: string; sub?: string;
}) => (
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

const ChartCard = ({
  title, sub, children,
}: {
  title: string; sub?: string; children: React.ReactNode;
}) => (
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
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 13,
    }}>
      <p style={{ color: '#64748b', marginBottom: 6, fontWeight: 500 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Productivity Insights panel ────────────────────────────── */
const ProductivityInsights = ({ tasks }: { tasks: Task[] }) => {
  const ins = useMemo(() => deriveProductivityInsights(tasks), [tasks]);

  const trendColor =
    ins.trend === 'improving' ? '#059669'
    : ins.trend === 'declining' ? '#dc2626'
    : '#d97706';

  const trendSub =
    ins.trend === 'improving'  ? `↑ Up from ${ins.lastWeekDone} last week`
    : ins.trend === 'declining' ? `↓ Down from ${ins.lastWeekDone} last week`
    : ins.trend === 'stable'    ? `→ Same as last week (${ins.lastWeekDone})`
    : 'Complete tasks to see trend';

  const cards = [
    {
      icon: <Icons.target />,
      label: 'On-Time Rate',
      value: ins.onTimeRate !== null ? `${ins.onTimeRate}%` : '—',
      sub:
        ins.onTimeRate === null ? 'Add due dates to tasks to track this'
        : ins.onTimeRate >= 80  ? 'Tasks finished before deadline'
        : ins.onTimeRate >= 50  ? 'Room to improve on deadlines'
        : 'Many tasks missed their deadline',
      accent:
        ins.onTimeRate === null ? '#94a3b8'
        : ins.onTimeRate >= 80  ? '#059669'
        : ins.onTimeRate >= 50  ? '#d97706'
        : '#dc2626',
    },
    {
      icon: <Icons.alert />,
      label: 'Currently Overdue',
      value: ins.overdueCount === 0 ? 'None' : String(ins.overdueCount),
      sub:
        ins.overdueCount === 0
          ? 'All tasks with due dates on track'
          : `${ins.overdueCount} task${ins.overdueCount > 1 ? 's' : ''} past due date`,
      accent: ins.overdueCount === 0 ? '#059669' : '#dc2626',
    },
    {
      icon: <Icons.timer />,
      label: 'Avg Completion Time',
      value: ins.avgDays !== null ? `${ins.avgDays} day${ins.avgDays !== 1 ? 's' : ''}` : '—',
      sub: ins.avgDays !== null ? 'Average from creation to done' : 'Complete tasks to see this',
      accent: '#6366f1',
    },
    {
      icon: ins.trend === 'declining' ? <Icons.trendDown /> : <Icons.trendUp />,
      label: 'Weekly Trend',
      value: `${ins.thisWeekDone} done`,
      sub: trendSub,
      accent: trendColor,
    },
  ];

  return (
    <div className="an__productivity">
      {cards.map((c, i) => (
        <div key={i} className="an-pi-card" style={{ borderTopColor: c.accent }}>
          <div className="an-pi-card__icon" style={{ color: c.accent, background: `${c.accent}12` }}>
            {c.icon}
          </div>
          <div className="an-pi-card__value" style={{ color: c.accent }}>{c.value}</div>
          <div className="an-pi-card__label">{c.label}</div>
          <div className="an-pi-card__sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
};

/* ── Heatmap ────────────────────────────────────────────────── */
const HeatmapSection = ({ workspaceId }: { workspaceId: string | null }) => {
  const [data, setData]       = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsAPI.getProductivityHeatmap(workspaceId ?? undefined)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const last35 = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (34 - i));
      return d.toISOString().split('T')[0];
    }), []
  );

  const countMap = useMemo(
    () => new Map(data.map(d => [d.date.split('T')[0], d.completed_count])),
    [data]
  );

  const getLevel = (n: number) =>
    n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;

  if (loading) return (
    <ChartCard title="30-Day Activity" sub="Tasks completed per day">
      <div className="an-loading-sm"><div className="an-spinner" /></div>
    </ChartCard>
  );

  return (
    <ChartCard title="30-Day Activity" sub="Tasks completed per day">
      <div className="an-heatmap">
        {last35.map(date => {
          const count = countMap.get(date) || 0;
          const label = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short',
          });
          return (
            <div
              key={date}
              className={`an-heatmap__cell an-heatmap__cell--${getLevel(count)}`}
              title={`${label}: ${count} task${count !== 1 ? 's' : ''} completed`}
            />
          );
        })}
      </div>
      <div className="an-heatmap__legend">
        <span className="an-heatmap__legend-text">Less</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} className={`an-heatmap__cell an-heatmap__cell--${l} an-heatmap__cell--sm`} />
        ))}
        <span className="an-heatmap__legend-text">More</span>
      </div>
    </ChartCard>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export const Dashboard: React.FC = () => {
  const { workspaceId, loading: wsLoading } = useWorkspace();

  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [priority, setPriority] = useState<PriorityBreakdown[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    // Wait for workspace context to finish resolving before fetching
    if (wsLoading) return;

    setLoading(true);
    setError('');

    Promise.all([
      analyticsAPI.getDashboardStats(workspaceId ?? undefined),
      analyticsAPI.getPriorityAnalytics(workspaceId ?? undefined),
      workspaceId
        ? tasksAPI.getAll({ workspaceId })
        : Promise.resolve({ data: [] as Task[] }),
    ])
      .then(([statsRes, prioRes, tasksRes]) => {
        setStats(statsRes.data);
        setPriority(prioRes.data);
        setTasks(tasksRes.data || []);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, [workspaceId, wsLoading]);

  const weeklyData = useMemo(() => deriveWeeklyData(tasks), [tasks]);

  const pieData = useMemo(() =>
    stats
      ? [
          { name: 'Completed', value: stats.completedTasks, color: '#10b981' },
          { name: 'Pending',   value: stats.pendingTasks,   color: '#f59e0b' },
          { name: 'Overdue',   value: stats.overdueTasks,   color: '#ef4444' },
        ].filter(d => d.value > 0)
      : [],
  [stats]);

  const PRIORITY_COLORS: Record<string, string> = {
    High: '#ef4444', Medium: '#f59e0b', Low: '#10b981',
  };

  if (loading) return (
    <div className="an-loading">
      <div className="an-spinner" />
      <p>Loading analytics…</p>
    </div>
  );
  if (error)  return <div className="an-error">{error}</div>;
  if (!stats) return null;

  const completionRate = stats.completionRate || 0;

  return (
    <div className="an">

      {/* Stat row */}
      <div className="an__stats">
        <StatCard label="Total Tasks"     value={stats.totalTasks}     icon={<Icons.layers />}  accent="#0ea5e9" sub="All tracked tasks" />
        <StatCard label="Completed"       value={stats.completedTasks} icon={<Icons.check />}   accent="#10b981" sub={`${completionRate}% rate`} />
        <StatCard label="Pending"         value={stats.pendingTasks}   icon={<Icons.clock />}   accent="#f59e0b" />
        <StatCard label="Overdue"         value={stats.overdueTasks}   icon={<Icons.alert />}   accent="#ef4444" sub={stats.overdueTasks > 0 ? 'Need attention' : 'All on track'} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<Icons.percent />} accent="#6366f1" sub={`${stats.completedTasks} of ${stats.totalTasks} done`} />
      </div>

      {/* Row 1: Weekly Activity + Task Distribution */}
      <div className="an__grid an__grid--2">
        <ChartCard title="Weekly Activity" sub="Tasks created vs completed — current week">
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
              <Pie
                data={pieData} cx="50%" cy="50%"
                outerRadius={88} innerRadius={48}
                dataKey="value" paddingAngle={3}
                label={({ cx, cy, midAngle, outerRadius, percent, name }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 22;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  if (percent < 0.06) return null;
                  return (
                    <text
                      x={x} y={y}
                      fill="#374151"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      style={{ fontSize: 11.5, fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 500 }}
                    >
                      {`${name} ${Math.round(percent * 100)}%`}
                    </text>
                  );
                }}
                labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
              >
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Priority Breakdown + Productivity Insights */}
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

        <ChartCard title="Productivity Insights" sub="Deadline adherence and completion trends">
          <ProductivityInsights tasks={tasks} />
        </ChartCard>
      </div>

      {/* Heatmap */}
      <HeatmapSection workspaceId={workspaceId} />

    </div>
  );
};
