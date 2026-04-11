import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import '../styles/Charts.css';

interface Props {
  completed: number;
  pending: number;
}

export const CompletionRateChart: React.FC<Props> = ({ completed, pending }) => {
  const data = [
    { name: 'Completed', value: completed },
    { name: 'Pending',   value: pending   },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="chart-container">
      <h3>Task Completion Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};