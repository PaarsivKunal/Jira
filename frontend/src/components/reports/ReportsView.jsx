import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getReports, deleteReport } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  FileText,
  Trash2,
  Plus,
  Settings,
} from 'lucide-react';

const reportTypes = [
  {
    id: 'average_age',
    name: 'Average Age Report',
    icon: BarChart3,
    color: 'bg-blue-500',
    description:
      'Shows the average age of unresolved issues for a project or filter. This helps you see whether your backlog is being kept up to date.',
    category: 'Issues analysis',
  },
  {
    id: 'created_vs_resolved',
    name: 'Created vs. Resolved Issues Report',
    icon: TrendingUp,
    color: 'bg-red-500',
    description:
      'Maps created issues versus resolved issues over a period of time. This can help you understand whether you overall backlog is growing or shrinking.',
    category: 'Issues analysis',
  },
  {
    id: 'pie_chart',
    name: 'Pie Chart Report',
    icon: PieChart,
    color: 'bg-purple-500',
    description:
      'Shows a pie chart of the issues in a project/filter grouped by a specified field. This helps you see the breakdown of set of issues, at a glance.',
    category: 'Issues analysis',
  },
  {
    id: 'recently_created',
    name: 'Recently Created Issues Report',
    icon: BarChart3,
    color: 'bg-green-500',
    description:
      'Shows the number of issues created over a period of time for a project/filter, and how many were resolved. This helps you track issue creation trends.',
    category: 'Issues analysis',
  },
  {
    id: 'resolution_time',
    name: 'Resolution Time Report',
    icon: Clock,
    color: 'bg-yellow-500',
    description:
      'Shows the length of time taken to resolve a set of issues for a project/filter. This helps you identify trends and incidents that take longer to resolve.',
    category: 'Issues analysis',
  },
  {
    id: 'single_level_group_by',
    name: 'Single Level Group By Report',
    icon: BarChart3,
    color: 'bg-gray-500',
    description:
      'Shows issues grouped by a particular field for a filter. This helps you group search results by a field and see the distribution.',
    category: 'Issues analysis',
  },
  {
    id: 'time_tracking',
    name: 'Time Tracking Report',
    icon: Clock,
    color: 'bg-indigo-500',
    description: 'Shows time tracking data for issues in a project/filter.',
    category: 'Forecast & management',
  },
  {
    id: 'user_workload',
    name: 'User Workload Report',
    icon: Users,
    color: 'bg-pink-500',
    description: 'Shows the workload distribution across team members.',
    category: 'Forecast & management',
  },
  {
    id: 'version_workload',
    name: 'Version Workload Report',
    icon: Calendar,
    color: 'bg-teal-500',
    description: 'Shows workload distribution across versions.',
    category: 'Forecast & management',
  },
  {
    id: 'workload_pie_chart',
    name: 'Workload Pie Chart Report',
    icon: PieChart,
    color: 'bg-orange-500',
    description: 'Shows workload as a pie chart.',
    category: 'Other',
  },
  {
    id: 'burndown_chart',
    name: 'Burndown Chart',
    icon: TrendingUp,
    color: 'bg-blue-600',
    description: 'Shows sprint/project progress over time with remaining work.',
    category: 'Forecast & management',
  },
  {
    id: 'velocity_chart',
    name: 'Velocity Chart',
    icon: BarChart3,
    color: 'bg-green-600',
    description: 'Tracks team velocity across sprints to predict future capacity.',
    category: 'Forecast & management',
  },
  {
    id: 'cumulative_flow',
    name: 'Cumulative Flow Diagram',
    icon: TrendingUp,
    color: 'bg-purple-600',
    description: 'Shows workflow state transitions over time to identify bottlenecks.',
    category: 'Issues analysis',
  },
  {
    id: 'heatmap',
    name: 'Activity Heatmap',
    icon: Calendar,
    color: 'bg-red-600',
    description: 'Visualizes issue activity by day/week/month to identify patterns.',
    category: 'Issues analysis',
  },
  {
    id: 'scatter_plot',
    name: 'Scatter Plot',
    icon: BarChart3,
    color: 'bg-indigo-600',
    description: 'Correlation analysis between priority and resolution time.',
    category: 'Issues analysis',
  },
  {
    id: 'time_tracking_pie',
    name: 'Time Tracking Pie Chart',
    icon: PieChart,
    color: 'bg-teal-600',
    description: 'Time spent breakdown by issue type or user.',
    category: 'Forecast & management',
  },
  {
    id: 'sprint_progress',
    name: 'Sprint Progress',
    icon: Clock,
    color: 'bg-yellow-600',
    description: 'Visual sprint completion with remaining work indicator.',
    category: 'Forecast & management',
  },
];

const ReportsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reportsResponse } = useQuery({
    queryKey: ['reports', id],
    queryFn: () => getReports(id).then((res) => res.data),
  });

  // Extract reports array from paginated response
  const reports = Array.isArray(reportsResponse?.data) 
    ? reportsResponse.data 
    : Array.isArray(reportsResponse) 
    ? reportsResponse 
    : [];

  const deleteMutation = useMutation({
    mutationFn: (reportId) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries(['reports', id]);
      toast.success('Report deleted');
    },
  });

  const handleCreateReport = (reportType) => {
    navigate(`/projects/${id}/reports/new?type=${reportType.id}`, { replace: false });
  };

  const handleDelete = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteMutation.mutate(reportId);
    }
  };

  const groupedReports = reportTypes.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-1">Projects / Landing page</div>
        <h1 className="text-2xl font-bold text-gray-900">All reports</h1>
      </div>

      {Object.entries(groupedReports).map(([category, categoryReports]) => (
        <div key={category} className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryReports.map((reportType) => {
              const Icon = reportType.icon;
              return (
                <div
                  key={reportType.id}
                  onClick={() => handleCreateReport(reportType)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${reportType.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle settings
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Settings size={16} className="text-gray-500" />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {reportType.name}
                  </h3>
                  <p className="text-sm text-gray-600">{reportType.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Existing Reports */}
      {reports && reports.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Saved Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const reportType = reportTypes.find((rt) => rt.id === report.type);
              const Icon = reportType?.icon || FileText;
              return (
                <div
                  key={report._id}
                  onClick={() => navigate(`/projects/${id}/reports/${report._id}/view`)}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${reportType?.color || 'bg-gray-500'} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(report._id);
                      }}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
                  <p className="text-sm text-gray-600">
                    Created {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;

