import React from 'react';
import '../styles/TaskFilters.css';

interface TaskFiltersProps {
  onFilterChange: (priority?: string, status?: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ onFilterChange }) => {
  const [priority, setPriority] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value;
    setPriority(newPriority);
    onFilterChange(newPriority || undefined, status || undefined);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    onFilterChange(priority || undefined, newStatus || undefined);
  };

  const handleReset = () => {
    setPriority('');
    setStatus('');
    onFilterChange();
  };

  return (
    <div className="filters-container">
      <h3>Filter Tasks</h3>
      <div className="filters-group">
        <select value={priority} onChange={handlePriorityChange}>
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select value={status} onChange={handleStatusChange}>
          <option value="">All Statuses</option>
          <option value="Todo">Todo</option>
          <option value="In-Progress">In-Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <button onClick={handleReset}>Reset Filters</button>
      </div>
    </div>
  );
};