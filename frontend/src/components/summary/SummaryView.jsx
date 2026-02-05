import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getProjectStats, getProject } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  Edit,
  Plus,
  Calendar,
  Coffee,
  Globe,
  UserPlus,
  Settings,
} from 'lucide-react';

const SummaryView = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id).then((res) => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['projectStats', id],
    queryFn: () => getProjectStats(id).then((res) => res.data),
  });

  if (!project || !stats) {
    return <div className="p-6">Loading...</div>;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusPercentage = (status) => {
    if (stats.totalIssues === 0) return 0;
    return Math.round((stats.statusBreakdown[status] / stats.totalIssues) * 100);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-blue-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getTypePercentage = (type) => {
    if (stats.totalIssues === 0) return 0;
    return Math.round((stats.typeBreakdown[type] / stats.totalIssues) * 100);
  };

  const getWorkloadPercentage = (count) => {
    if (stats.totalIssues === 0) return 0;
    return Math.round((count / stats.totalIssues) * 100);
  };

  const formatActivity = (activity) => {
    const userName = activity.userId?.name || 'Unknown';
    const issueKey = activity.issueId?.key || '';
    const issueTitle = activity.issueId?.title || '';

    if (activity.type === 'comment') {
      return {
        text: `${userName} commented on ${issueKey}-${issueTitle}`,
        detail: activity.content,
        timestamp: activity.timestamp,
        user: activity.userId,
      };
    }

    if (activity.action === 'status_changed') {
      return {
        text: `${userName} changed the status to ${activity.newValue} on ${issueKey}-${issueTitle}`,
        timestamp: activity.createdAt,
        user: activity.userId,
      };
    }

    if (activity.action === 'updated') {
      return {
        text: `${userName} updated the ${activity.field} of ${issueKey}-${issueTitle}`,
        timestamp: activity.createdAt,
        user: activity.userId,
      };
    }

    if (activity.action === 'created') {
      return {
        text: `${userName} created ${issueKey}-${issueTitle}`,
        timestamp: activity.createdAt,
        user: activity.userId,
      };
    }

    return {
      text: `${userName} ${activity.action} ${issueKey}-${issueTitle}`,
      timestamp: activity.createdAt,
      user: activity.userId,
    };
  };

  const totalStatus = Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0);
  const largestStatus = Math.max(...Object.values(stats.statusBreakdown), 0);
  const largestStatusKey = Object.keys(stats.statusBreakdown).find(
    (k) => stats.statusBreakdown[k] === largestStatus
  ) || 'todo';

  return (
    <div className="p-6 space-y-6">
      {/* Greeting Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {getGreeting()}, {user?.name || 'User'} 👋
            </h1>
            <p className="text-gray-600">
              Here's where you'll view a summary of {project.name}'s status, priorities, workload,
              and more.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>Project detail</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-gray-600">Project lead:</span>{' '}
            <span className="font-medium text-gray-900">{project.lead?.name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Project key:</span>{' '}
            <span className="font-medium text-gray-900">{project.key}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Done</span>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.metrics.done}</div>
          <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Updated</span>
            <Edit className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.metrics.updated}</div>
          <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Created</span>
            <Plus className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.metrics.created}</div>
          <div className="text-xs text-gray-500 mt-1">Last 7 days</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Due</span>
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.metrics.due}</div>
          <div className="text-xs text-gray-500 mt-1">Overdue</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Status overview</h2>
              <p className="text-sm text-gray-600">
                Get a snapshot of the status of your items.
              </p>
            </div>
            <a href="#" className="text-sm text-primary-600 hover:underline">
              View all items
            </a>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="16"
                  strokeDasharray={`${(stats.statusBreakdown.todo / totalStatus) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {getStatusPercentage(largestStatusKey)}%
                  </div>
                  <div className="text-xs text-gray-600 capitalize">{largestStatusKey?.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">To Do</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.statusBreakdown.todo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">In Progress</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.statusBreakdown.in_progress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">In Review</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.statusBreakdown.in_review}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Done</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.statusBreakdown.done}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Total</span>
                  <span className="text-sm font-bold text-gray-900">{totalStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Recent activity</h2>
          <p className="text-sm text-gray-600 mb-4">
            Stay up to date with what's happening across the project.
          </p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">TODAY</div>
            {stats.recentActivity.slice(0, 10).map((activity) => {
              const formatted = formatActivity(activity);
              return (
                <div key={activity._id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs flex-shrink-0">
                    {formatted.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{formatted.text}</p>
                    {formatted.detail && (
                      <p className="text-sm text-gray-600 mt-1 italic">"{formatted.detail}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(formatted.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            {stats.recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Priority breakdown</h2>
          <p className="text-sm text-gray-600 mb-4">
            Get a holistic view of how work has been prioritized.
          </p>
          <div className="space-y-3">
            {['critical', 'high', 'medium', 'low'].map((priority) => {
              const count = stats.priorityBreakdown[priority] || 0;
              const maxCount = Math.max(...Object.values(stats.priorityBreakdown));
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {priority === 'critical' ? 'Highest' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Types of Work */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Types of work</h2>
              <p className="text-sm text-gray-600">
                Get a breakdown of items by their types.
              </p>
            </div>
            <a href="#" className="text-sm text-primary-600 hover:underline">
              Manage types
            </a>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.typeBreakdown)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">{type}</span>
                    <span className="text-sm text-gray-600">
                      {getTypePercentage(type)}% ({count})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary-600"
                      style={{ width: `${getTypePercentage(type)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Team Workload */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team workload</h2>
            <p className="text-sm text-gray-600">
              Oversee the capacity of your team.
            </p>
          </div>
          <a href="#" className="text-sm text-primary-600 hover:underline flex items-center">
            <UserPlus size={14} className="mr-1" />
            Invite teammate
          </a>
        </div>
        <div className="space-y-3">
          {stats.workload.map((member) => {
            const percentage = getWorkloadPercentage(member.count);
            return (
              <div key={member.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {member.id !== 'unassigned' && member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : member.id !== 'unassigned' ? (
                      <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                    <span className="text-sm font-medium text-gray-900">{member.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {percentage}% ({member.count})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Projects */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Related projects</h2>
        <p className="text-sm text-gray-600 mb-4">
          Use projects to manage all your work in one place and stay aligned with stakeholders.
        </p>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-6">
            <Globe className="w-16 h-16 text-blue-500" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white" />
          </div>
          <div className="flex space-x-3 mb-6">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
              Create a project
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
              View all projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;

