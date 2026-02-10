import Report from '../models/Report.js';
import Issue from '../models/Issue.js';
import { convertToCSV, convertToJSON } from '../utils/exportService.js';
import { getReportData } from './reportController.js';

/**
 * Export report data in various formats
 * @route GET /api/reports/:id/export
 * @access Private
 */
export const exportReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv' } = req.query;

    const report = await Report.findById(id).populate('projectId');
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Get report data
    const projectId = report.projectId._id;
    let issues = await Issue.find({ projectId })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('projectId', 'name key')
      .lean();

    // Apply date range filter if configured
    if (report.config.dateRange?.start || report.config.dateRange?.end) {
      const startDate = report.config.dateRange.start ? new Date(report.config.dateRange.start) : null;
      const endDate = report.config.dateRange.end ? new Date(report.config.dateRange.end) : null;
      
      issues = issues.filter(issue => {
        const issueDate = new Date(issue.createdAt);
        if (startDate && issueDate < startDate) return false;
        if (endDate && issueDate > endDate) return false;
        return true;
      });
    }

    // Convert issues to exportable format
    const exportData = issues.map(issue => ({
      Key: issue.key,
      Title: issue.title,
      Type: issue.type,
      Status: issue.status,
      Priority: issue.priority,
      Assignee: issue.assignee?.name || 'Unassigned',
      Reporter: issue.reporter?.name || 'Unknown',
      'Created At': new Date(issue.createdAt).toLocaleDateString(),
      'Updated At': new Date(issue.updatedAt).toLocaleDateString(),
      'Due Date': issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : '',
      Labels: issue.labels?.join(', ') || '',
      'Time Spent': issue.timeSpent || 0,
      'Remaining Estimate': issue.remainingEstimate || 0,
    }));

    // Set response headers based on format
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}`;

    switch (format.toLowerCase()) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        const csvContent = convertToCSV(exportData);
        return res.send(Buffer.from(csvContent, 'utf-8'));

      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        return res.json(exportData);

      case 'excel':
        // For Excel, we'll use a library that can stream to response
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return res.send(buffer);

      default:
        return res.status(400).json({ message: 'Invalid export format. Use csv, json, or excel' });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Export error:', error);
    }
    res.status(500).json({ message: error.message });
  }
};

