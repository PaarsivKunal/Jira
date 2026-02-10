import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, getReportData } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import ExportButton from '../components/reports/ExportButton';
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
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
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

      case 'burndown_chart':
        const burndownData = reportData.burndownData?.map((item) => ({
          date: item.date,
          remaining: item.remaining,
          completed: item.completed,
          ideal: item.ideal,
        })) || [];
        return (
          <div>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold">{reportData.sprintName}</h3>
              <p className="text-sm text-gray-600">Total Points: {reportData.totalPoints}</p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ideal" stroke="#9ca3af" strokeDasharray="5 5" name="Ideal" />
                <Line type="monotone" dataKey="remaining" stroke="#ef4444" name="Remaining" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'velocity_chart':
        const velocityData = reportData.velocityData || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprintName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#3b82f6" name="Completed Issues" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'cumulative_flow':
        const flowChartData = reportData.periods?.map((period, index) => ({
          period,
          todo: reportData.todo[index],
          in_progress: reportData.in_progress[index],
          in_review: reportData.in_review[index],
          done: reportData.done[index],
        })) || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={flowChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="todo" stackId="1" stroke="#9ca3af" fill="#9ca3af" />
              <Area type="monotone" dataKey="in_progress" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
              <Area type="monotone" dataKey="in_review" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
              <Area type="monotone" dataKey="done" stackId="1" stroke="#10b981" fill="#10b981" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'heatmap':
        const heatmapData = reportData.periods?.map((period, index) => ({
          period,
          value: reportData.values[index],
        })) || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={heatmapData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ef4444">
                {heatmapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 10 ? '#dc2626' : entry.value > 5 ? '#ef4444' : '#fca5a5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter_plot':
        const scatterData = reportData.scatterData || [];
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" name="Priority" domain={[0, 5]} />
              <YAxis type="number" dataKey="y" name="Resolution Time (days)" />
              <ZAxis type="number" dataKey="y" range={[100, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Issues" data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'time_tracking_pie':
        const timeByType = reportData.byType?.labels?.map((label, index) => ({
          name: label,
          value: reportData.byType.values[index],
        })) || [];
        const timeByUser = reportData.byUser?.labels?.map((label, index) => ({
          name: label,
          value: reportData.byUser.values[index],
        })) || [];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">Time by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={timeByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {timeByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">Time by User</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={timeByUser}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {timeByUser.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'sprint_progress':
        const progress = reportData.progress || 0;
        return (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-4">{reportData.sprintName}</h3>
            <div className="relative w-64 h-64 mx-auto mb-6">
              <svg className="transform -rotate-90 w-64 h-64">
                <circle
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="#10b981"
                  strokeWidth="20"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 100}`}
                  strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{progress.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{reportData.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reportData.done}</div>
                <div className="text-sm text-gray-600">Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{reportData.remaining}</div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
            </div>
          </div>
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
          <div className="flex items-center space-x-2">
            <ExportButton reportId={reportId} reportName={report.name} />
            <button
              onClick={() => navigate(`/projects/${id}/reports/${reportId}`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Configure
            </button>
          </div>
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
