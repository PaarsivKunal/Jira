import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MoreVertical,
  Bug,
  FileText,
  BookOpen,
  Zap,
  Flag,
  Calendar,
  User,
  Tag,
  Clock,
} from 'lucide-react';

const typeIcons = {
  bug: Bug,
  task: FileText,
  story: BookOpen,
  epic: Zap,
};

const priorityIcons = {
  critical: { icon: Flag, color: 'text-red-600' },
  high: { icon: ChevronUp, color: 'text-orange-600' },
  medium: { icon: MoreVertical, color: 'text-yellow-600' },
  low: { icon: ChevronDown, color: 'text-blue-600' },
};

const statusColors = {
  todo: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
};

const ListView = ({ issues, onCreateIssue, onUpdate }) => {
  const navigate = useNavigate();
  const [selectedIssues, setSelectedIssues] = useState(new Set());
  const [sortColumn, setSortColumn] = useState('key');
  const [sortDirection, setSortDirection] = useState('asc');
  const [visibleColumns, setVisibleColumns] = useState([
    'checkbox',
    'type',
    'key',
    'summary',
    'status',
    'assignee',
    'dueDate',
    'priority',
  ]);

  const defaultColumns = [
    { id: 'checkbox', label: '', width: 'w-12' },
    { id: 'type', label: 'Type', width: 'w-16' },
    { id: 'key', label: '# Key', width: 'w-24' },
    { id: 'summary', label: 'Summary', width: 'flex-1' },
    { id: 'status', label: 'Status', width: 'w-32' },
    { id: 'category', label: 'Category', width: 'w-32' },
    { id: 'assignee', label: '@ Assignee', width: 'w-32' },
    { id: 'dueDate', label: 'Due Date', width: 'w-32' },
    { id: 'priority', label: 'Priority', width: 'w-24' },
    { id: 'labels', label: 'Labels', width: 'w-32' },
    { id: 'created', label: 'Created', width: 'w-32' },
    { id: 'updated', label: 'Updated', width: 'w-32' },
    { id: 'reporter', label: 'Reporter', width: 'w-32' },
  ];

  const sortedIssues = useMemo(() => {
    const sorted = [...issues];
    sorted.sort((a, b) => {
      let aVal, bVal;

      switch (sortColumn) {
        case 'key':
          aVal = a.key || '';
          bVal = b.key || '';
          break;
        case 'summary':
          aVal = a.title || '';
          bVal = b.title || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'assignee':
          aVal = a.assignee?.name || '';
          bVal = b.assignee?.name || '';
          break;
        case 'dueDate':
          aVal = a.dueDate ? new Date(a.dueDate) : new Date(0);
          bVal = b.dueDate ? new Date(b.dueDate) : new Date(0);
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'created':
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case 'updated':
          aVal = new Date(a.updatedAt);
          bVal = new Date(b.updatedAt);
          break;
        case 'reporter':
          aVal = a.reporter?.name || '';
          bVal = b.reporter?.name || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [issues, sortColumn, sortDirection]);

  const handleSort = (columnId) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIssues(new Set(sortedIssues.map((i) => i._id)));
    } else {
      setSelectedIssues(new Set());
    }
  };

  const handleSelectIssue = (issueId) => {
    const newSelected = new Set(selectedIssues);
    if (newSelected.has(issueId)) {
      newSelected.delete(issueId);
    } else {
      newSelected.add(issueId);
    }
    setSelectedIssues(newSelected);
  };

  const handleRowClick = (issueId) => {
    navigate(`/issues/${issueId}`);
  };

  const renderCell = (issue, columnId) => {
    switch (columnId) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={selectedIssues.has(issue._id)}
            onChange={(e) => {
              e.stopPropagation();
              handleSelectIssue(issue._id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300"
          />
        );
      case 'type':
        const TypeIcon = typeIcons[issue.type] || FileText;
        return <TypeIcon size={16} className="text-gray-500" />;
      case 'key':
        return (
          <span className="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary-600">
            {issue.key}
          </span>
        );
      case 'summary':
        return (
          <span className="text-sm text-gray-900 cursor-pointer hover:text-primary-600">
            {issue.title}
          </span>
        );
      case 'status':
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium capitalize ${
              statusColors[issue.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {issue.status?.replace('_', ' ') || 'N/A'}
          </span>
        );
      case 'category':
        return <span className="text-sm text-gray-600">-</span>;
      case 'assignee':
        const assigneesList = (issue.assignees && issue.assignees.length > 0)
          ? issue.assignees
          : (issue.assignee ? [issue.assignee] : []);
        
        if (assigneesList.length > 0) {
          return (
            <div className="flex items-center space-x-1">
              {assigneesList.slice(0, 3).map((assignee, index) => (
                <div key={assignee?._id || assignee || index} className="flex items-center" title={assignee?.name}>
                  {assignee?.avatar ? (
                    <img
                      src={assignee.avatar}
                      alt={assignee.name}
                      className="w-6 h-6 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs border-2 border-white">
                      {assignee?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}
              {assigneesList.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">+{assigneesList.length - 3}</span>
              )}
            </div>
          );
        }
        return <span className="text-sm text-gray-400">Unassigned</span>;
      case 'dueDate':
        if (issue.dueDate) {
          return (
            <span className="text-sm text-gray-900">
              {format(new Date(issue.dueDate), 'd MMM, yyyy').toUpperCase()}
            </span>
          );
        }
        return <span className="text-sm text-gray-400">-</span>;
      case 'priority':
        const priority = priorityIcons[issue.priority] || priorityIcons.medium;
        const PriorityIcon = priority.icon;
        return (
          <div className="flex items-center">
            <PriorityIcon size={16} className={priority.color} />
          </div>
        );
      case 'labels':
        if (issue.labels && issue.labels.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {issue.labels.slice(0, 2).map((label, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs"
                >
                  {label}
                </span>
              ))}
              {issue.labels.length > 2 && (
                <span className="text-xs text-gray-500">+{issue.labels.length - 2}</span>
              )}
            </div>
          );
        }
        return <span className="text-sm text-gray-400">-</span>;
      case 'created':
        return (
          <span className="text-sm text-gray-600">
            {format(new Date(issue.createdAt), 'd MMM, yyyy').toUpperCase()}
          </span>
        );
      case 'updated':
        return (
          <span className="text-sm text-gray-600">
            {format(new Date(issue.updatedAt), 'd MMM, yyyy').toUpperCase()}
          </span>
        );
      case 'reporter':
        if (issue.reporter) {
          return (
            <div className="flex items-center space-x-2">
              {issue.reporter.avatar ? (
                <img
                  src={issue.reporter.avatar}
                  alt={issue.reporter.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                  {issue.reporter.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-900">{issue.reporter.name}</span>
            </div>
          );
        }
        return <span className="text-sm text-gray-400">-</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {defaultColumns
                .filter((col) => visibleColumns.includes(col.id))
                .map((column) => (
                  column.id === 'checkbox' ? (
                    <th key={column.id} className={`${column.width} px-4 py-3`}>
                      <input
                        type="checkbox"
                        checked={selectedIssues.size === sortedIssues.length && sortedIssues.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                  ) : (
                  <th
                    key={column.id}
                    className={`${column.width} px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                      column.id !== 'checkbox' && column.id !== 'type' ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => column.id !== 'checkbox' && column.id !== 'type' && handleSort(column.id)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortColumn === column.id && column.id !== 'checkbox' && column.id !== 'type' && (
                        <span>
                          {sortDirection === 'asc' ? (
                            <ChevronUp size={14} className="text-gray-500" />
                          ) : (
                            <ChevronDown size={14} className="text-gray-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  )
                ))}
              <th className="w-12 px-4 py-3">
                <button className="text-gray-400 hover:text-gray-600" title="Add column">
                  <Plus size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedIssues.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  No issues found
                </td>
              </tr>
            ) : (
              sortedIssues.map((issue) => (
                <tr
                  key={issue._id}
                  onClick={() => handleRowClick(issue._id)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedIssues.has(issue._id) ? 'bg-blue-50' : ''
                  }`}
                >
                  {defaultColumns
                    .filter((col) => visibleColumns.includes(col.id))
                    .map((column) => (
                      <td key={column.id} className={`${column.width} px-4 py-3`}>
                        {renderCell(issue, column.id)}
                      </td>
                    ))}
                  <td className="w-12 px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedIssues.size > 0 && (
            <span>{selectedIssues.size} selected</span>
          )}
        </div>
        <button
          onClick={() => onCreateIssue?.()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 text-sm font-medium"
        >
          <Plus size={16} />
          <span>Create</span>
        </button>
      </div>
    </div>
  );
};

export default ListView;

