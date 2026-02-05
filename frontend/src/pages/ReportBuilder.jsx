import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getReport, createReport, updateReport, getReportData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Eye, BarChart3, PieChart } from 'lucide-react';

const ReportBuilder = () => {
  const { id, reportId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!reportId;
  const reportTypeParam = searchParams.get('type') || 'pie_chart';

  const { data: report } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReport(reportId).then((res) => res.data),
    enabled: isEditing,
  });

  const [formData, setFormData] = useState({
    name: '',
    type: reportTypeParam,
    config: {
      groupBy: 'status',
      period: 'week',
    },
  });

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        type: report.type,
        config: report.config || formData.config,
      });
    }
  }, [report]);

  const createMutation = useMutation({
    mutationFn: (data) => createReport(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['reports', id]);
      toast.success('Report created successfully');
      navigate(`/projects/${id}/reports/${response.data._id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['report', reportId]);
      queryClient.invalidateQueries(['reports', id]);
      toast.success('Report updated successfully');
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const reportTypeNames = {
    pie_chart: 'Pie Chart Report',
    average_age: 'Average Age Report',
    created_vs_resolved: 'Created vs. Resolved Issues Report',
    recently_created: 'Recently Created Issues Report',
    resolution_time: 'Resolution Time Report',
    single_level_group_by: 'Single Level Group By Report',
    time_tracking: 'Time Tracking Report',
    user_workload: 'User Workload Report',
    version_workload: 'Version Workload Report',
    workload_pie_chart: 'Workload Pie Chart Report',
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/projects/${id}/board`)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <div className="text-sm text-gray-600 mb-1">Projects / Landing page / Reports</div>
              <h1 className="text-xl font-semibold text-gray-900">
                Configure - {reportTypeNames[formData.type] || 'Report'}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/projects/${id}/reports/${reportId || 'new'}/view`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Next</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter report name"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project or Saved filter</h2>
          <div className="mb-2">
            <span className="text-gray-900">Landing page</span>
            <a href="#" className="text-primary-600 hover:underline ml-2">
              Change Filter or Project...
            </a>
          </div>
          <p className="text-sm text-gray-600">
            Project or saved filter to use as the basis for the graph.
          </p>
        </div>

        {formData.type === 'pie_chart' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistic Type</h2>
            <select
              value={formData.config.groupBy}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, groupBy: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="status">Status</option>
              <option value="assignee">Assignee</option>
              <option value="type">Type</option>
              <option value="priority">Priority</option>
              <option value="reporter">Reporter</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Select which type of statistic to display for this filter.
            </p>
          </div>
        )}

        {formData.type === 'created_vs_resolved' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Period</h2>
            <select
              value={formData.config.period}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, period: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Select the time period for grouping the data.
            </p>
          </div>
        )}

        {formData.type === 'single_level_group_by' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Group By</h2>
            <select
              value={formData.config.groupBy}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, groupBy: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="status">Status</option>
              <option value="assignee">Assignee</option>
              <option value="type">Type</option>
              <option value="priority">Priority</option>
              <option value="reporter">Reporter</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Select which field to group issues by.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportBuilder;

