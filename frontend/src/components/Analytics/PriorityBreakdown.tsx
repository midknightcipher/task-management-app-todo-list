import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PriorityBreakdown as PriorityBreakdownType } from '../../types';
import { analyticsAPI } from '../../services/api';
import '../styles/Charts.css';

export const PriorityBreakdown: React.FC = () => {
  const [data, setData] = useState<PriorityBreakdownType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await analyticsAPI.getPriorityAnalytics();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch priority breakdown:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading chart...</div>;
  if (data.length === 0) return <div>No data available</div>;

  return (
    <div className="chart-container">
      <h3>Task Priority Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" name="Number of Tasks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};