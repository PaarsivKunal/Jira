import { useState, useEffect } from 'react';
import { X, Plus, Calendar } from 'lucide-react';
import { getUsers } from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const FilterBuilder = ({ filters, onChange, projectId }) => {
  const [localFilters, setLocalFilters] = useState(filters || {
    status: [],
    type: [],
    priority: [],
    assignee: [],
    reporter: [],
    labels: [],
  });
  const [dateRange, setDateRange] = useState({
    start: filters?.dateRange?.start || '',
    end: filters?.dateRange?.end || '',
  });
  const [filterLogic, setFilterLogic] = useState(filters?.filterLogic || 'AND');
  const [labelInput, setLabelInput] = useState('');

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then((res) => res.data),
  });

  const users = Array.isArray(usersResponse?.data)
    ? usersResponse.data
    : Array.isArray(usersResponse)
    ? usersResponse
    : [];

  useEffect(() => {
    onChange({
      filters: localFilters,
      dateRange,
      filterLogic,
    });
  }, [localFilters, dateRange, filterLogic]);

  const toggleFilter = (category, value) => {
    setLocalFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const addLabel = () => {
    if (labelInput.trim() && !localFilters.labels.includes(labelInput.trim())) {
      setLocalFilters(prev => ({
        ...prev,
        labels: [...prev.labels, labelInput.trim()],
      }));
      setLabelInput('');
    }
  };

  const removeLabel = (label) => {
    setLocalFilters(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l !== label),
    }));
  };

  const statusOptions = ['todo', 'in_progress', 'in_review', 'done'];
  const typeOptions = ['bug', 'task', 'story', 'epic'];
  const priorityOptions = ['low', 'medium', 'high', 'critical'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        <select
          value={filterLogic}
          onChange={(e) => setFilterLogic(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(status => (
            <button
              key={status}
              onClick={() => toggleFilter('status', status)}
              className={`px-3 py-1 rounded text-sm ${
                localFilters.status.includes(status)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map(type => (
            <button
              key={type}
              onClick={() => toggleFilter('type', type)}
              className={`px-3 py-1 rounded text-sm ${
                localFilters.type.includes(type)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map(priority => (
            <button
              key={priority}
              onClick={() => toggleFilter('priority', priority)}
              className={`px-3 py-1 rounded text-sm ${
                localFilters.priority.includes(priority)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {/* Assignee Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
        <select
          multiple
          value={localFilters.assignee}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setLocalFilters(prev => ({ ...prev, assignee: selected }));
          }}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          size={4}
        >
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reporter Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reporter</label>
        <select
          multiple
          value={localFilters.reporter}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setLocalFilters(prev => ({ ...prev, reporter: selected }));
          }}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          size={4}
        >
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Labels Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
            placeholder="Add label"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={addLabel}
            className="px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {localFilters.labels.map(label => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
            >
              {label}
              <button
                onClick={() => removeLabel(label)}
                className="hover:text-red-600"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Calendar size={16} />
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBuilder;

