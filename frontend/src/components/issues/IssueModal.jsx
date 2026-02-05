import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUsers } from '../../services/api';

const IssueModal = ({ isOpen, onClose, issue, onSubmit, projects, initialStatus, initialSprintId }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    projectId: '',
    assignees: [],
    labels: '',
    dueDate: '',
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (issue) {
        // Handle both old assignee (single) and new assignees (array)
        const assignees = issue.assignees && issue.assignees.length > 0
          ? issue.assignees.map(a => a?._id || a)
          : (issue.assignee ? [issue.assignee?._id || issue.assignee] : []);
        
        setFormData({
          title: issue.title || '',
          description: issue.description || '',
          type: issue.type || 'task',
          priority: issue.priority || 'medium',
          status: issue.status || 'todo',
          projectId: issue.projectId?._id || issue.projectId || '',
          assignees: assignees,
          labels: issue.labels?.join(', ') || '',
          dueDate: issue.dueDate
            ? new Date(issue.dueDate).toISOString().split('T')[0]
            : '',
        });
      } else {
        setFormData({
          title: '',
          description: '',
          type: 'task',
          priority: 'medium',
          status: initialStatus || 'todo',
          projectId: (Array.isArray(projects) && projects.length > 0) ? projects[0]._id : '',
          assignees: [],
          labels: '',
          dueDate: '',
          sprintId: initialSprintId || null,
        });
      }
      loadUsers();
    }
  }, [isOpen, issue, projects, initialStatus, initialSprintId]);

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      labels: formData.labels
        ? formData.labels.split(',').map((l) => l.trim()).filter(Boolean)
        : [],
      dueDate: formData.dueDate || undefined,
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {issue ? 'Edit Issue' : 'Create Issue'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project *
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              className="input"
              required
            >
              <option value="">Select a project</option>
              {Array.isArray(projects) && projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input"
              >
                <option value="task">Task</option>
                <option value="bug">Bug</option>
                <option value="story">Story</option>
                <option value="epic">Epic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          {issue && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="input"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignees
            </label>
            <select
              multiple
              value={formData.assignees}
              onChange={(e) => {
                const selectedAssignees = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, assignees: selectedAssignees });
              }}
              className="input min-h-[100px]"
              size={Math.min(users.length + 1, 6)}
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl (Windows) or Cmd (Mac) to select multiple users
            </p>
            {formData.assignees.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.assignees.map((assigneeId) => {
                  const user = users.find(u => u._id === assigneeId);
                  if (!user) return null;
                  return (
                    <span
                      key={assigneeId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {user.name}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            assignees: formData.assignees.filter(id => id !== assigneeId)
                          });
                        }}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Labels (comma-separated)
              </label>
              <input
                type="text"
                value={formData.labels}
                onChange={(e) =>
                  setFormData({ ...formData, labels: e.target.value })
                }
                className="input"
                placeholder="bug, frontend, urgent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {issue ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueModal;

