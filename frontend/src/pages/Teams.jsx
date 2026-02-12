import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Search } from 'lucide-react';
import { useState } from 'react';
import { getUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../config/departments';
import toast from 'react-hot-toast';

const Teams = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is manager or admin (they can see all users)
  const canSeeAllUsers = user?.role === 'manager' || user?.role === 'admin';

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users', 'teams'],
    queryFn: async () => {
      try {
        const response = await getUsers({});
        return Array.isArray(response.data) ? response.data : (response.data?.data || response.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        toast.error(err.response?.data?.message || 'Failed to load users');
        throw err;
      }
    },
  });

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group users by department
  const groupUsersByDepartment = () => {
    const grouped = {
      salesforce: [],
      web_development: [],
      mobile_development: [],
      no_department: [],
    };

    filteredUsers.forEach((user) => {
      if (!user.department || (Array.isArray(user.department) && user.department.length === 0)) {
        grouped.no_department.push(user);
      } else {
        const departments = Array.isArray(user.department) ? user.department : [user.department];
        departments.forEach((dept) => {
          if (dept === DEPARTMENTS.SALESFORCE) {
            grouped.salesforce.push(user);
          } else if (dept === DEPARTMENTS.WEB_DEVELOPMENT) {
            grouped.web_development.push(user);
          } else if (dept === DEPARTMENTS.MOBILE_DEVELOPMENT) {
            grouped.mobile_development.push(user);
          } else {
            grouped.no_department.push(user);
          }
        });
      }
    });

    return grouped;
  };

  const groupedUsers = groupUsersByDepartment();

  const getDepartmentLabel = (dept) => {
    switch (dept) {
      case 'salesforce':
        return 'Salesforce';
      case 'web_development':
        return 'Web Development';
      case 'mobile_development':
        return 'Mobile Development';
      case 'no_department':
        return 'No Department';
      default:
        return dept;
    }
  };

  const getDepartmentColor = (dept) => {
    switch (dept) {
      case 'salesforce':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'web_development':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'mobile_development':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'no_department':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatRole = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error.response?.data?.message || 'Failed to load team members'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-600 mt-1">
            {canSeeAllUsers
              ? 'View all team members organized by departments'
              : 'View team members in your departments'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Teams by Department */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedUsers).map(([dept, deptUsers]) => {
            if (deptUsers.length === 0) return null;

            return (
              <div
                key={dept}
                className={`bg-white rounded-lg shadow-sm border-2 ${getDepartmentColor(dept)}`}
              >
                <div className="p-4 border-b-2 border-current">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5" />
                      <h2 className="text-lg font-semibold">{getDepartmentLabel(dept)}</h2>
                      <span className="text-sm font-medium px-2 py-1 rounded-full bg-white/50">
                        {deptUsers.length} {deptUsers.length === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deptUsers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {member.avatar ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={member.avatar}
                              alt={member.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                            {formatRole(member.role)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900">No team members found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? 'Try adjusting your search' : 'No users available'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teams;

