import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, getReportData } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

const ReportView = () => {
  const { id, reportId } = useParams();
  const navigate = useNavigate();

  const { data: report } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => getReport(reportId).then((res) => res.data),
  });

  const { data: reportData } = useQuery({
    queryKey: ['reportData', reportId],
    queryFn: () => getReportData(reportId).then((res) => res.data),
    enabled: !!report,
  });

  if (!report) {
    return <div className="p-6">Loading...</div>;
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const renderChart = () => {
    if (!reportData) return <div className="text-center py-12">Loading chart data...</div>;

    switch (report.type) {
      case 'pie_chart':
        const pieData = reportData.labels?.map((label, index) => ({
          name: label,
          value: reportData.values[index],
        })) || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'created_vs_resolved':
        const chartData = reportData.periods?.map((period, index) => ({
          period,
          created: reportData.created[index],
          resolved: reportData.resolved[index],
        })) || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="created" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
              <Area type="monotone" dataKey="resolved" stackId="1" stroke="#10b981" fill="#10b981" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'average_age':
        const days = Math.floor(reportData.averageAge / (1000 * 60 * 60 * 24));
        return (
          <div className="text-center py-12">
            <div className="text-6xl font-bold text-gray-900 mb-2">{days}</div>
            <div className="text-xl text-gray-600">days average age</div>
            <div className="text-sm text-gray-500 mt-2">
              {reportData.totalIssues} unresolved issues
            </div>
          </div>
        );

      case 'single_level_group_by':
        const barData = reportData.groups?.map((group) => ({
          name: group.name,
          count: group.count,
        })) || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'user_workload':
        const workloadData = reportData.users?.map((user) => ({
          name: user.name,
          count: user.count,
        })) || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={workloadData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-center py-12">Chart type not implemented</div>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
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
              <h1 className="text-xl font-semibold text-gray-900">{report.name}</h1>
            </div>
          </div>
          <button
            onClick={() => navigate(`/projects/${id}/reports/${reportId}`)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Configure
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
