import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchWorkspaces } from '../store/slices/workspaceSlice';
import { fetchAnalytics } from '../store/slices/analyticsSlice';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import AppLayout from '../components/AppLayout';
import './Pages.css';

const IconStack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>;
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const IconClock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconAlert = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconPercent = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
const IconCircle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;

export const AnalyticsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { workspaces, status: wsStatus } = useAppSelector((state) => state.workspaces);
  const { kpis, trends, heatmap, actionRadar, status: analyticsStatus, currentWorkspaceId } = useAppSelector((state) => state.analytics);

  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(currentWorkspaceId); 

  useEffect(() => {
    if (wsStatus === 'idle') dispatch(fetchWorkspaces());
  }, [dispatch, wsStatus]);

  useEffect(() => {
    if (analyticsStatus === 'idle' || selectedWorkspace !== currentWorkspaceId) {
      dispatch(fetchAnalytics(selectedWorkspace));
    }
  }, [dispatch, selectedWorkspace, currentWorkspaceId, analyticsStatus]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#f1f5f9'; 
    if (count <= 1) return '#dcfce7';  
    if (count <= 3) return '#4ade80';  
    return '#16a34a';                  
  };

  const isLoading = analyticsStatus === 'loading' || !kpis;

  let pieData: {name: string, value: number, color: string}[] = [];
  if (kpis) {
    const pending = Math.max(0, kpis.total_tasks - kpis.completed_tasks - kpis.overdue_tasks);
    pieData = [
      { name: 'Completed', value: kpis.completed_tasks, color: '#10b981' }, 
      { name: 'Pending', value: pending, color: '#f59e0b' },     
      { name: 'Overdue', value: kpis.overdue_tasks, color: '#ef4444' }      
    ].filter(d => d.value > 0);
  }

  const formattedTrends = trends?.map(t => ({
    day: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: t.tasks_completed,
    created: t.tasks_created
  })) || [];

  return (
    <AppLayout>
      <div className="pg__container">
        <div className="pg__header">
          <div><h1 className="pg__title">Analytics</h1><p className="pg__subtitle">Insights into your productivity and task progress</p></div>
          <div className="pg__header-actions">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b'}}>Filter By:</label>
            <select className="pg__select" value={selectedWorkspace} onChange={(e) => setSelectedWorkspace(e.target.value)}>
              <option value="personal">My Personal Tasks</option>
              {workspaces.map(ws => (<option key={ws.id} value={ws.id}>{ws.name}</option>))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b'}}>Loading Live Analytics...</div>
        ) : (
          <>
            <div className="analytics-stats-grid">
              <div className="stat-card-modern"><div className="icon-box" style={{background: '#e0f2fe', color: '#0ea5e9'}}><IconStack /></div><div className="info"><h3>{kpis?.total_tasks || 0}</h3><p className="title">Total Tasks</p><p className="sub">All tracked tasks</p></div></div>
              <div className="stat-card-modern"><div className="icon-box" style={{background: '#dcfce7', color: '#10b981'}}><IconCheck /></div><div className="info"><h3>{kpis?.completed_tasks || 0}</h3><p className="title">Completed</p><p className="sub">Successfully finished</p></div></div>
              <div className="stat-card-modern"><div className="icon-box" style={{background: '#f3e8ff', color: '#8b5cf6'}}><IconPercent /></div><div className="info"><h3>{((kpis?.completion_rate || 0) * 100).toFixed(0)}%</h3><p className="title">Completion Rate</p><p className="sub">Volume processed</p></div></div>
              <div className="stat-card-modern"><div className="icon-box" style={{background: '#fee2e2', color: '#ef4444'}}><IconAlert /></div><div className="info"><h3>{kpis?.overdue_tasks || 0}</h3><p className="title">Overdue Tasks</p><p className="sub">Missed deadlines</p></div></div>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <div className="proj-card" style={{ flex: '6' }}>
                <h3 style={{marginBottom: '6px', fontSize: '16px'}}>30-Day Activity Trends</h3>
                <p className="text-muted" style={{marginBottom: '20px'}}>Tasks created vs completed — OLAP history</p>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedTrends}>
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

              <div className="proj-card" style={{ flex: '4' }}>
                <h3 style={{marginBottom: '6px', fontSize: '16px'}}>Task Distribution</h3>
                <p className="text-muted" style={{marginBottom: '20px'}}>Live Snapshot: Completed vs Pending vs Overdue</p>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                        {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div className="proj-card" style={{ flex: '6' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                   <div><h3 style={{marginBottom: '6px', fontSize: '16px'}}>Current Month Pacing</h3><p className="text-muted" style={{margin: 0}}>GitHub-style daily volume tracking</p></div>
                   <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155', background: '#f8fafc', padding: '4px 12px', borderRadius: '16px' }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 32px)', gap: '6px', justifyContent: 'center', textAlign: 'center' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (<div key={i} style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>{d}</div>))}
                    {(() => {
                       const today = new Date();
                       const currentYear = today.getFullYear();
                       const currentMonth = today.getMonth();
                       const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                       const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
                       const blanks = Array.from({ length: firstDayOfWeek }).map((_, i) => (<div key={`blank-${i}`} />));
                       const days = Array.from({ length: daysInMonth }, (_, i) => {
                         const dayNum = i + 1;
                         const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                         const dayData = heatmap.find(h => h.date === dateStr);
                         const count = dayData ? Number(dayData.count) : 0;
                         return (
                           <div key={dateStr} title={`${count} tasks completed on ${dateStr}`} style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: getHeatmapColor(count), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: count > 0 ? '#14532d' : '#94a3b8', border: count > 0 ? '1px solid transparent' : '1px solid #e2e8f0', cursor: 'pointer' }}>
                             {dayNum}
                           </div>
                         );
                       });
                       return [...blanks, ...days];
                    })()}
                 </div>
              </div>

              <div className="proj-card" style={{ flex: '4', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div><h3 style={{marginBottom: '2px', fontSize: '16px'}}>Action Radar</h3><p className="text-muted" style={{margin: 0}}>Immediate execution needs</p></div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ color: '#ef4444' }}><IconAlert /></div><h4 style={{ margin: 0, fontSize: '14px', color: '#334155' }}>Urgent (&lt; 48h)</h4>
                      <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>{actionRadar.urgent.length}</span>
                    </div>
                    {actionRadar.urgent.length === 0 ? (<p style={{ fontSize: '13px', color: '#94a3b8', paddingLeft: '28px' }}>No urgent deadlines.</p>) : (
                      actionRadar.urgent.map(task => (
                        <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{display: 'flex', gap: '10px', alignItems: 'center', overflow: 'hidden'}}><IconCircle /><span style={{fontSize: '13px', color: '#334155', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{task.title}</span></div>
                          <span style={{fontSize: '11px', color: '#ef4444', fontWeight: 600, paddingLeft: '8px', whiteSpace: 'nowrap'}}>Due {new Date(task.due_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ color: '#f59e0b' }}><IconClock /></div><h4 style={{ margin: 0, fontSize: '14px', color: '#334155' }}>Stale (7+ Days)</h4>
                      <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>{actionRadar.stale.length}</span>
                    </div>
                    {actionRadar.stale.length === 0 ? (<p style={{ fontSize: '13px', color: '#94a3b8', paddingLeft: '28px' }}>No stale tasks.</p>) : (
                      actionRadar.stale.map(task => {
                         const diffTime = Math.abs(new Date().getTime() - new Date(task.updated_at).getTime());
                         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                         return (
                           <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                             <div style={{display: 'flex', gap: '10px', alignItems: 'center', overflow: 'hidden'}}><IconCircle /><span style={{fontSize: '13px', color: '#334155', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{task.title}</span></div>
                             <span style={{fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap'}}>{diffDays}d ago</span>
                           </div>
                         )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;