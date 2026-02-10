import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Filter } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getIssues, getProjects, createIssue } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueModal from '../components/issues/IssueModal';
import SkeletonLoader from '../components/common/SkeletonLoader';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: projectsResponse, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects().then((res) => res.data),
  });

  const { data: issuesResponse, refetch, isLoading: issuesLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: () => getIssues().then((res) => res.data),
  });

  // Extract arrays from paginated responses
  const projects = Array.isArray(projectsResponse?.data)
    ? projectsResponse.data
    : Array.isArray(projectsResponse)
      ? projectsResponse
      : [];

  const issues = Array.isArray(issuesResponse?.data)
    ? issuesResponse.data
    : Array.isArray(issuesResponse)
      ? issuesResponse
      : [];

  const handleCreateIssue = async (data) => {
    try {
      await createIssue(data);
      toast.success('Issue created successfully');
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to create issue');
    }
  };

  const getStats = () => [
    {
      label: 'Total Issues',
      value: issues.length || 0,
      color: 'bg-blue-500',
    },
    {
      label: 'In Progress',
      value: issues.filter((i) => i.status === 'in_progress').length || 0,
      color: 'bg-yellow-500',
    },
    {
      label: 'Done',
      value: issues.filter((i) => i.status === 'done').length || 0,
      color: 'bg-green-500',
    },
    {
      label: 'Projects',
      value: projects.length || 0,
      color: 'bg-purple-500',
    },
  ];

  // Format department name for display
  const formatDepartment = (dept) => {
    if (!dept) return '';
    return dept.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          {/* Show department filter info for Managers */}
          {user?.role === 'manager' && user?.department && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
              <Filter size={16} />
              <span>
                Showing projects for: <span className="font-semibold text-gray-900">{formatDepartment(user.department)}</span>
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary flex items-center space-x-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Create Issue</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {issuesLoading || projectsLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="card h-24 flex items-center p-4">
              <SkeletonLoader type="text" className="w-full" />
            </div>
          ))
        ) : (
          getStats().map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-xl font-bold">{stat.value}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Issues */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Issues</h2>
        <div className="space-y-2">
          {issuesLoading ? (
            <div className="space-y-4">
              <SkeletonLoader type="text" count={3} />
            </div>
          ) : issues.length > 0 ? (
            issues.slice(0, 5).map((issue) => (
              <Link
                key={issue._id}
                to={`/issues/${issue._id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    {issue.key}
                  </span>
                  <span className="text-sm text-gray-700">{issue.title}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${issue.status === 'done'
                      ? 'bg-green-100 text-green-800'
                      : issue.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {issue.status.replace('_', ' ')}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No issues yet</p>
          )}
        </div>
      </div>

      <IssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateIssue}
        projects={projects}
      />
    </div>
  );
};

export default Dashboard;
