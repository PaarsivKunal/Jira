import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Users as UsersIcon, Building2, Edit2 } from 'lucide-react';
import { getUsers, createUser, createOrganization, updateUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import CreateUserModal from '../components/admin/CreateUserModal';
import EditUserModal from '../components/admin/EditUserModal';
import CreateOrganizationModal from '../components/admin/CreateOrganizationModal';
import { DEPARTMENTS } from '../config/departments';

const ROLES = ['admin', 'manager', 'project_manager', 'developer', 'viewer'];

const UserManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users', roleFilter, departmentFilter],
    queryFn: async () => {
      try {
        const params = {};
        if (roleFilter !== 'all') params.role = roleFilter;
        if (departmentFilter !== 'all') params.department = departmentFilter;
        const response = await getUsers(params);
        // Handle both array response and object with data property
        return Array.isArray(response.data) ? response.data : (response.data?.data || response.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error(err.response?.data?.message || 'Failed to load users');
        throw err;
      }
    },
    enabled: isAdmin,
    retry: 1,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowCreateModal(false);
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowEditModal(false);
      setEditingUser(null);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      // Invalidate all relevant queries instead of reloading
      queryClient.invalidateQueries(['users']);
      queryClient.invalidateQueries(['project']);
      queryClient.invalidateQueries(['projects']);
      // Refetch user data to get updated organization info
      queryClient.invalidateQueries(['auth', 'me']);
      setShowCreateOrgModal(false);
      toast.success('Organization created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    },
  });

  // Filter users by search term
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You need admin privileges to access user management.</p>
        </div>
      </div>
    );
  }

  // Check if user has organization - will be checked via error from API

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Departments</option>
            <option value={DEPARTMENTS.SALESFORCE}>Salesforce</option>
            <option value={DEPARTMENTS.WEB_DEVELOPMENT}>Web Development</option>
            <option value={DEPARTMENTS.MOBILE_DEVELOPMENT}>Mobile Development</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {error ? (
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Building2 className="w-8 h-8 text-red-600" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-red-800 font-semibold text-lg">Organization Required</h3>
                  <p className="text-red-700 text-sm mt-2">
                    {error.response?.data?.message || 'Your account is not assigned to an organization.'}
                  </p>
                  <div className="mt-4 bg-white rounded-lg p-4 border border-red-200">
                    <p className="text-gray-700 text-sm font-medium mb-3">Quick Fix - Create Organization:</p>
                    <button
                      onClick={() => setShowCreateOrgModal(true)}
                      className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-5 h-5" />
                      Create Organization Now
                    </button>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 text-sm font-medium mb-2">Alternative Options:</p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        <li>Run the migration script: <code className="bg-gray-100 px-2 py-1 rounded text-xs">node backend/scripts/migrateToOrganizations.js</code></li>
                        <li>Or contact your system administrator</li>
                      </ol>
                    </div>
                  </div>
                  <p className="text-red-600 text-xs mt-4">
                    <strong>Note:</strong> This error also affects Projects and other features. All users must belong to an organization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm mt-2">
              {searchTerm || roleFilter !== 'all' || departmentFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first user to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar}
                              alt={user.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 text-primary-800">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.department && user.department.length > 0 ? (
                        Array.isArray(user.department) ? (
                          <div className="flex flex-wrap gap-1">
                            {user.department.map(dept => {
                              const deptLabel = dept === DEPARTMENTS.SALESFORCE ? 'Salesforce' :
                                               dept === DEPARTMENTS.WEB_DEVELOPMENT ? 'Web Development' :
                                               dept === DEPARTMENTS.MOBILE_DEVELOPMENT ? 'Mobile Development' : dept;
                              return (
                                <span key={dept} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                  {deptLabel}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            {user.department === DEPARTMENTS.SALESFORCE ? 'Salesforce' :
                             user.department === DEPARTMENTS.WEB_DEVELOPMENT ? 'Web Development' :
                             user.department === DEPARTMENTS.MOBILE_DEVELOPMENT ? 'Mobile Development' : user.department}
                          </span>
                        )
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowEditModal(true);
                        }}
                        className="text-primary-600 hover:text-primary-900 transition-colors"
                        title="Edit user"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(userData) => createUserMutation.mutate(userData)}
          isLoading={createUserMutation.isLoading}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSubmit={(data) => updateUserMutation.mutate({ id: editingUser._id, data })}
          isLoading={updateUserMutation.isLoading}
        />
      )}

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateOrgModal(false)}
          onSubmit={(orgData) => createOrgMutation.mutate(orgData)}
          isLoading={createOrgMutation.isLoading}
          userEmail={user?.email}
        />
      )}
    </div>
  );
};

export default UserManagement;

