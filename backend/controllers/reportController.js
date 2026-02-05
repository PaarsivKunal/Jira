import Report from '../models/Report.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';

// @desc    Get all reports for a project
// @route   GET /api/projects/:projectId/reports
// @access  Private
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ projectId: req.params.projectId })
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
export const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name key');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create report
// @route   POST /api/projects/:projectId/reports
// @access  Private
export const createReport = async (req, res) => {
  try {
    const { name, type, config } = req.body;

    const report = await Report.create({
      projectId: req.params.projectId,
      name,
      type,
      config: config || {},
      createdBy: req.user._id,
    });

    const populatedReport = await Report.findById(report._id)
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name key');

    res.status(201).json(populatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get report data
// @route   GET /api/reports/:id/data
// @access  Private
export const getReportData = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('projectId');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const projectId = report.projectId._id;
    let issues = await Issue.find({ projectId })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    let data = {};

    switch (report.type) {
      case 'pie_chart':
        const groupBy = report.config.groupBy || 'status';
        const grouped = {};
        issues.forEach((issue) => {
          const key = issue[groupBy] || 'unassigned';
          grouped[key] = (grouped[key] || 0) + 1;
        });
        data = {
          labels: Object.keys(grouped),
          values: Object.values(grouped),
        };
        break;

      case 'average_age':
        const unresolved = issues.filter((i) => i.status !== 'done');
        const now = new Date();
        const totalAge = unresolved.reduce((sum, issue) => {
          const age = now - new Date(issue.createdAt);
          return sum + age;
        }, 0);
        data = {
          averageAge: unresolved.length > 0 ? totalAge / unresolved.length : 0,
          totalIssues: unresolved.length,
        };
        break;

      case 'created_vs_resolved':
        const period = report.config.period || 'week';
        const periods = [];
        const created = [];
        const resolved = [];
        // Simplified - group by period
        const groupedByPeriod = {};
        issues.forEach((issue) => {
          const createdDate = new Date(issue.createdAt);
          const periodKey = formatPeriod(createdDate, period);
          if (!groupedByPeriod[periodKey]) {
            groupedByPeriod[periodKey] = { created: 0, resolved: 0 };
          }
          groupedByPeriod[periodKey].created++;
          if (issue.status === 'done') {
            const resolvedDate = new Date(issue.updatedAt);
            const resolvedPeriod = formatPeriod(resolvedDate, period);
            if (!groupedByPeriod[resolvedPeriod]) {
              groupedByPeriod[resolvedPeriod] = { created: 0, resolved: 0 };
            }
            groupedByPeriod[resolvedPeriod].resolved++;
          }
        });
        Object.keys(groupedByPeriod)
          .sort()
          .forEach((key) => {
            periods.push(key);
            created.push(groupedByPeriod[key].created);
            resolved.push(groupedByPeriod[key].resolved);
          });
        data = { periods, created, resolved };
        break;

      case 'recently_created':
        const recentIssues = issues
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 20);
        data = {
          issues: recentIssues.map((i) => ({
            key: i.key,
            title: i.title,
            createdAt: i.createdAt,
            status: i.status,
          })),
        };
        break;

      case 'resolution_time':
        const resolvedIssues = issues.filter((i) => i.status === 'done');
        const resolutionTimes = resolvedIssues.map((issue) => {
          const created = new Date(issue.createdAt);
          const resolved = new Date(issue.updatedAt);
          return resolved - created;
        });
        data = {
          averageResolutionTime:
            resolutionTimes.length > 0
              ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
              : 0,
          totalResolved: resolutionTimes.length,
          resolutionTimes: resolutionTimes.slice(0, 50),
        };
        break;

      case 'single_level_group_by':
        const groupByField = report.config.groupBy || 'status';
        const groupedIssues = {};
        issues.forEach((issue) => {
          const key = issue[groupByField] || 'unassigned';
          if (!groupedIssues[key]) {
            groupedIssues[key] = [];
          }
          groupedIssues[key].push({
            key: issue.key,
            title: issue.title,
            status: issue.status,
          });
        });
        data = {
          groups: Object.keys(groupedIssues).map((key) => ({
            name: key,
            count: groupedIssues[key].length,
            issues: groupedIssues[key],
          })),
        };
        break;

      case 'user_workload':
        const workload = {};
        issues.forEach((issue) => {
          const assigneeId = issue.assignee?._id || 'unassigned';
          const assigneeName = issue.assignee?.name || 'Unassigned';
          if (!workload[assigneeId]) {
            workload[assigneeId] = { name: assigneeName, count: 0 };
          }
          workload[assigneeId].count++;
        });
        data = {
          users: Object.values(workload),
        };
        break;

      default:
        data = { message: 'Report type not implemented' };
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to format date by period
function formatPeriod(date, period) {
  const d = new Date(date);
  switch (period) {
    case 'day':
      return d.toISOString().split('T')[0];
    case 'week':
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return weekStart.toISOString().split('T')[0];
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'quarter':
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${quarter}`;
    case 'year':
      return d.getFullYear().toString();
    default:
      return d.toISOString().split('T')[0];
  }
}

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name key');

    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

