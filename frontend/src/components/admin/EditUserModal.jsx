import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DEPARTMENTS } from '../../config/departments';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'developer', label: 'Developer' },
  { value: 'manager', label: 'Manager' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'viewer', label: 'Viewer' },
];

const EditUserModal = ({ user, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'developer',
    departments: [],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'developer',
        departments: Array.isArray(user.department) ? user.department : (user.department ? [user.department] : []),
      });
    }
  }, [user]);

  const handleDepartmentToggle = (dept) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter(d => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    // Validate departments only for developers
    if (formData.role === 'developer' && formData.departments.length === 0) {
      toast.error('Please select at least one department for developers');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      department: formData.departments,
    });
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              id="edit-email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              id="edit-role"
              required
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setFormData({
                  ...formData,
                  role: newRole,
                  // Clear departments if role is admin or viewer (they don't need departments)
                  departments: (newRole === 'admin' || newRole === 'viewer') ? [] : formData.departments
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {(formData.role === 'developer' || formData.role === 'manager' || formData.role === 'project_manager') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.role === 'developer' ? 'Departments *' : 'Departments (Optional)'}
              </label>
              <div className="space-y-2">
                {Object.entries(DEPARTMENTS).map(([key, value]) => (
                  <label key={value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.departments.includes(value)}
                      onChange={() => handleDepartmentToggle(value)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {key === 'SALESFORCE' ? 'Salesforce' : 
                       key === 'WEB_DEVELOPMENT' ? 'Web Development' : 
                       'Mobile Development'}
                    </span>
                  </label>
                ))}
              </div>
              {formData.role === 'manager' && (
                <p className="mt-2 text-xs text-gray-500">
                  Managers without departments can assign tasks to anyone across all departments
                </p>
              )}
            </div>
          )}

          {(formData.role === 'admin' || formData.role === 'viewer') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{formData.role === 'admin' ? 'Admin' : 'Viewer'}</strong> roles have access to all departments and projects. No department selection is needed.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

