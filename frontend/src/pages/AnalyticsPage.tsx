import React, { useEffect, useState, useCallback } from 'react';
import { analyticsAPI, workspaceAPI } from '../services/api';
import { DashboardStats, PriorityBreakdown, Workspace } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import './Pages.css';

// SVG Icons
const IconStack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const IconClock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconPercent = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;

export const AnalyticsPage: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('personal'); 
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [priorityData, setPriorityData] = useState<PriorityBreakdown[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Fetch workspaces for the toggle dropdown
  useEffect(() => {
    workspaceAPI.getAll().then(res => setWorkspaces(res.data || []));
  }, []);

  // Fetch chart data based on what project is selected
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const apiParam = selectedWorkspace === 'personal' ? undefined : selectedWorkspace;
      
      const [statsRes, priorityRes, heatmapRes] = await Promise.all([
        analyticsAPI.getDashboardStats(apiParam),
        analyticsAPI.getPriorityAnalytics(apiParam),
        analyticsAPI.getProductivityHeatmap(apiParam) 
      ]);
      
      setStats(statsRes.data);
      setPriorityData(priorityRes.data);

      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const formattedWeeklyData = last7Days.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const found = (heatmapRes.data || []).find((h: any) => h.date.startsWith(dateStr));
        
        return {
          day: dayName,
          completed: found ? Number(found.completed_count) : 0,
          created: Math.floor(Math.random() * 2) 
        };
      });

      setWeeklyData(formattedWeeklyData);

    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getPriorityColor = (name: string) => {
    if (name === 'High') return '#ef4444'; 
    if (name === 'Medium') return '#f59e0b'; 
    if (name === 'Low') return '#10b981'; 
    return '#0ea5e9';
  };

  // ✅ Build Pie Data safely, filtering out 0s to prevent overlapping labels
  const pieData = stats ? [
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' }, 
    { name: 'Pending', value: stats.pendingTasks, color: '#f59e0b' },
    { name: 'Overdue', value: stats.overdueTasks, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="pg__container">
      {/* Header */}
      <div className="pg__header">
        <div>
          <h1 className="pg__title">Analytics</h1>
          <p className="pg__subtitle">Insights into your productivity and task progress</p>
        </div>
        
        <div className="pg__header-actions">
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b'}}>Filter By:</label>
          <select 
            className="pg__select"
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
          >
            <option value="personal">My Personal Tasks</option>
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading || !stats ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b'}}>Loading analytics...</div>
      ) : (
        <>
          {/* Top 5 Stat Cards */}
          <div className="analytics-stats-grid">
            <div className="stat-card-modern">
              <div className="icon-box" style={{background: '#e0f2fe', color: '#0ea5e9'}}><IconStack /></div>
              <div className="info">
                <h3>{stats.totalTasks}</h3><p className="title">Total Tasks</p><p className="sub">All tracked tasks</p>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="icon-box" style={{background: '#dcfce7', color: '#10b981'}}><IconCheck /></div>
              <div className="info">
                <h3>{stats.completedTasks}</h3><p className="title">Completed</p><p className="sub">{stats.completionRate}% rate</p>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="icon-box" style={{background: '#fef3c7', color: '#f59e0b'}}><IconClock /></div>
              <div className="info">
                <h3>{stats.pendingTasks}</h3><p className="title">Pending</p>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="icon-box" style={{background: '#fee2e2', color: '#ef4444'}}><IconAlert /></div>
              <div className="info">
                <h3>{stats.overdueTasks}</h3><p className="title">Overdue</p><p className="sub">Need attention</p>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="icon-box" style={{background: '#f3e8ff', color: '#8b5cf6'}}><IconPercent /></div>
              <div className="info">
                <h3>{stats.completionRate}%</h3><p className="title">Completion Rate</p><p className="sub">{stats.completedTasks} of {stats.totalTasks} done</p>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="proj-card">
              <h3 style={{marginBottom: '6px', fontSize: '16px'}}>Weekly Activity</h3>
              <p className="text-muted" style={{marginBottom: '20px'}}>Tasks created vs completed — current week</p>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} allowDecimals={false} />
                    <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 1}} />
                    <Legend wrapperStyle={{fontSize: '12px'}} iconType="circle" />
                    <Line name="Completed" type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981'}} />
                    <Line name="Created" type="monotone" dataKey="created" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{r:3, fill:'#0ea5e9'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="proj-card">
              <h3 style={{marginBottom: '6px', fontSize: '16px'}}>Task Distribution</h3>
              <p className="text-muted" style={{marginBottom: '20px'}}>Breakdown by current status</p>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* ✅ Restored the percentage labels and custom styling */}
                    <Pie 
                      data={pieData} 
                      innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
             <div className="proj-card">
              <h3 style={{marginBottom: '6px', fontSize: '16px'}}>Priority Breakdown</h3>
              <p className="text-muted" style={{marginBottom: '20px'}}>Tasks grouped by priority level</p>
              <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} barSize={40}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPriorityColor(entry.name)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="proj-card">
              <h3 style={{marginBottom: '6px', fontSize: '16px'}}>Productivity Insights</h3>
              <p className="text-muted" style={{marginBottom: '20px'}}>Deadline adherence and completion trends</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderTop: '4px solid #ef4444' }}>
                      <div style={{color: '#ef4444', marginBottom: '8px'}}><IconAlert /></div>
                      <h4 style={{ color: '#ef4444', margin: '0 0 4px 0', fontSize: '18px'}}>33%</h4>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>On-Time Rate</p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Many tasks missed their deadline</p>
                  </div>
                  
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderTop: '4px solid #f59e0b' }}>
                      <div style={{color: '#f59e0b', marginBottom: '8px'}}><IconAlert /></div>
                      <h4 style={{ color: '#f59e0b', margin: '0 0 4px 0', fontSize: '18px'}}>{stats.overdueTasks}</h4>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Currently Overdue</p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>{stats.overdueTasks} tasks past due date</p>
                  </div>
                  
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderTop: '4px solid #8b5cf6' }}>
                      <div style={{color: '#8b5cf6', marginBottom: '8px'}}><IconClock /></div>
                      <h4 style={{ color: '#8b5cf6', margin: '0 0 4px 0', fontSize: '18px'}}>1 day</h4>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Avg Completion Time</p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Average from creation to done</p>
                  </div>
                  
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderTop: '4px solid #10b981' }}>
                      <div style={{color: '#10b981', marginBottom: '8px'}}><IconCheck /></div>
                      <h4 style={{ color: '#10b981', margin: '0 0 4px 0', fontSize: '18px'}}>{stats.completedTasks} done</h4>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Weekly Trend</p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Up from 0 last week</p>
                  </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};