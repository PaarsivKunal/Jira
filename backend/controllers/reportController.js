import Report from '../models/Report.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';
import WorkLog from '../models/WorkLog.js';
import Activity from '../models/Activity.js';

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
    let query = { projectId };

    // Apply advanced filters if configured
    if (report.config.filters) {
      const filters = report.config.filters;
      const filterLogic = report.config.filterLogic || 'AND';
      const filterConditions = [];

      if (filters.status && filters.status.length > 0) {
        filterConditions.push({ status: { $in: filters.status } });
      }
      if (filters.type && filters.type.length > 0) {
        filterConditions.push({ type: { $in: filters.type } });
      }
      if (filters.priority && filters.priority.length > 0) {
        filterConditions.push({ priority: { $in: filters.priority } });
      }
      if (filters.assignee && filters.assignee.length > 0) {
        filterConditions.push({
          $or: [
            { assignee: { $in: filters.assignee } },
            { assignees: { $in: filters.assignee } }
          ]
        });
      }
      if (filters.reporter && filters.reporter.length > 0) {
        filterConditions.push({ reporter: { $in: filters.reporter } });
      }
      if (filters.labels && filters.labels.length > 0) {
        filterConditions.push({ labels: { $in: filters.labels } });
      }

      if (filterConditions.length > 0) {
        if (filterLogic === 'OR') {
          query.$or = filterConditions;
        } else {
          query.$and = filterConditions;
        }
      }
    }

    // Apply date range filter
    if (report.config.dateRange?.start || report.config.dateRange?.end) {
      query.createdAt = {};
      if (report.config.dateRange.start) {
        query.createdAt.$gte = new Date(report.config.dateRange.start);
      }
      if (report.config.dateRange.end) {
        query.createdAt.$lte = new Date(report.config.dateRange.end);
      }
    }

    let issues = await Issue.find(query)
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

      case 'burndown_chart':
        const sprintId = report.config.sprintId;
        if (!sprintId) {
          data = { message: 'Sprint ID is required for burndown chart' };
          break;
        }
        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
          data = { message: 'Sprint not found' };
          break;
        }
        const sprintIssues = issues.filter(i => i.sprintId?.toString() === sprintId.toString());
        const startDate = sprint.startDate ? new Date(sprint.startDate) : new Date();
        const endDate = sprint.endDate ? new Date(sprint.endDate) : new Date();
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        const burndownData = [];
        const totalPoints = sprintIssues.length;
        let remainingPoints = totalPoints;
        
        for (let i = 0; i <= days; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          const completedByDate = sprintIssues.filter(issue => {
            if (issue.status === 'done') {
              const doneDate = new Date(issue.updatedAt);
              return doneDate <= currentDate;
            }
            return false;
          }).length;
          remainingPoints = totalPoints - completedByDate;
          burndownData.push({
            date: currentDate.toISOString().split('T')[0],
            remaining: remainingPoints,
            completed: completedByDate,
            ideal: totalPoints - (totalPoints * i / days),
          });
        }
        data = { burndownData, totalPoints, sprintName: sprint.name };
        break;

      case 'velocity_chart':
        const sprints = await Sprint.find({ projectId }).sort({ startDate: 1 });
        const velocityData = [];
        for (const sprint of sprints) {
          if (sprint.status === 'closed' || sprint.status === 'active') {
            const sprintIssuesList = issues.filter(i => 
              i.sprintId?.toString() === sprint._id.toString() && i.status === 'done'
            );
            velocityData.push({
              sprintName: sprint.name,
              completed: sprintIssuesList.length,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
            });
          }
        }
        data = { velocityData };
        break;

      case 'cumulative_flow':
        const flowPeriod = report.config.period || 'day';
        const statuses = ['todo', 'in_progress', 'in_review', 'done'];
        const flowData = {};
        
        // Get all activities for status changes
        const issueIds = issues.map(i => i._id);
        const activities = await Activity.find({
          issueId: { $in: issueIds },
          field: 'status',
        }).sort({ createdAt: 1 });
        
        // Initialize flow data for all periods
        const allPeriods = new Set();
        issues.forEach(issue => {
          const createdDate = new Date(issue.createdAt);
          const periodKey = formatPeriod(createdDate, flowPeriod);
          allPeriods.add(periodKey);
        });
        
        allPeriods.forEach(period => {
          flowData[period] = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
        });
        
        // Calculate cumulative flow
        issues.forEach(issue => {
          const createdDate = new Date(issue.createdAt);
          const createdPeriod = formatPeriod(createdDate, flowPeriod);
          
          // Get status history for this issue
          const issueActivities = activities.filter(a => 
            a.issueId.toString() === issue._id.toString()
          );
          
          // Track status at each period
          const sortedPeriods = Array.from(allPeriods).sort();
          let currentStatus = 'todo';
          
          sortedPeriods.forEach(period => {
            const periodDate = new Date(period);
            // Check if issue was created before this period
            if (new Date(issue.createdAt) <= periodDate) {
              // Find status at this period
              const statusAtPeriod = issueActivities
                .filter(a => new Date(a.createdAt) <= periodDate)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
              
              if (statusAtPeriod) {
                currentStatus = statusAtPeriod.newValue;
              } else {
                currentStatus = issue.status;
              }
              
              if (flowData[period] && statuses.includes(currentStatus)) {
                flowData[period][currentStatus] = (flowData[period][currentStatus] || 0) + 1;
              }
            }
          });
        });
        
        const sortedPeriods = Array.from(allPeriods).sort();
        data = {
          periods: sortedPeriods,
          todo: sortedPeriods.map(p => flowData[p]?.todo || 0),
          in_progress: sortedPeriods.map(p => flowData[p]?.in_progress || 0),
          in_review: sortedPeriods.map(p => flowData[p]?.in_review || 0),
          done: sortedPeriods.map(p => flowData[p]?.done || 0),
        };
        break;

      case 'heatmap':
        const heatmapPeriod = report.config.period || 'day';
        const heatmapData = {};
        issues.forEach(issue => {
          const date = new Date(issue.createdAt);
          const periodKey = formatPeriod(date, heatmapPeriod);
          if (!heatmapData[periodKey]) {
            heatmapData[periodKey] = 0;
          }
          heatmapData[periodKey]++;
        });
        data = {
          periods: Object.keys(heatmapData).sort(),
          values: Object.keys(heatmapData).sort().map(key => heatmapData[key]),
        };
        break;

      case 'scatter_plot':
        const scatterData = issues.map(issue => {
          const created = new Date(issue.createdAt);
          const resolved = issue.status === 'done' ? new Date(issue.updatedAt) : null;
          const resolutionTime = resolved ? (resolved - created) / (1000 * 60 * 60 * 24) : null; // days
          const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 };
          return {
            x: priorityMap[issue.priority] || 2,
            y: resolutionTime,
            key: issue.key,
            title: issue.title,
            status: issue.status,
          };
        }).filter(d => d.y !== null);
        data = { scatterData };
        break;

      case 'time_tracking_pie':
        const workLogs = await WorkLog.find({ 
          issueId: { $in: issues.map(i => i._id) } 
        }).populate('userId', 'name');
        
        const timeByType = {};
        const timeByUser = {};
        
        workLogs.forEach(log => {
          const issue = issues.find(i => i._id.toString() === log.issueId.toString());
          if (issue) {
            const hours = log.timeSpent / 60; // Convert minutes to hours
            // By type
            if (!timeByType[issue.type]) {
              timeByType[issue.type] = 0;
            }
            timeByType[issue.type] += hours;
            
            // By user
            const userId = log.userId?._id?.toString() || 'unassigned';
            const userName = log.userId?.name || 'Unassigned';
            if (!timeByUser[userId]) {
              timeByUser[userId] = { name: userName, hours: 0 };
            }
            timeByUser[userId].hours += hours;
          }
        });
        
        data = {
          byType: {
            labels: Object.keys(timeByType),
            values: Object.values(timeByType),
          },
          byUser: {
            labels: Object.values(timeByUser).map(u => u.name),
            values: Object.values(timeByUser).map(u => u.hours),
          },
        };
        break;

      case 'sprint_progress':
        const activeSprintId = report.config.sprintId;
        if (!activeSprintId) {
          // Find active sprint
          const activeSprint = await Sprint.findOne({ projectId, status: 'active' });
          if (!activeSprint) {
            data = { message: 'No active sprint found' };
            break;
          }
          const sprintIssuesList = issues.filter(i => 
            i.sprintId?.toString() === activeSprint._id.toString()
          );
          const total = sprintIssuesList.length;
          const done = sprintIssuesList.filter(i => i.status === 'done').length;
          const inProgress = sprintIssuesList.filter(i => i.status === 'in_progress').length;
          const todo = sprintIssuesList.filter(i => i.status === 'todo').length;
          
          data = {
            sprintName: activeSprint.name,
            total,
            done,
            inProgress,
            todo,
            progress: total > 0 ? (done / total) * 100 : 0,
            remaining: total - done,
          };
        } else {
          const sprint = await Sprint.findById(activeSprintId);
          if (!sprint) {
            data = { message: 'Sprint not found' };
            break;
          }
          const sprintIssuesList = issues.filter(i => 
            i.sprintId?.toString() === activeSprintId.toString()
          );
          const total = sprintIssuesList.length;
          const done = sprintIssuesList.filter(i => i.status === 'done').length;
          const inProgress = sprintIssuesList.filter(i => i.status === 'in_progress').length;
          const todo = sprintIssuesList.filter(i => i.status === 'todo').length;
          
          data = {
            sprintName: sprint.name,
            total,
            done,
            inProgress,
            todo,
            progress: total > 0 ? (done / total) * 100 : 0,
            remaining: total - done,
          };
        }
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

