import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Activity from '../models/Activity.js';
import Comment from '../models/Comment.js';

// @desc    Get project statistics
// @route   GET /api/projects/:id/stats
// @access  Private
export const getProjectStats = async (req, res) => {
  try {
    const projectId = req.params.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all issues for the project
    const issues = await Issue.find({ projectId })
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Get activities for the project
    const issueIds = issues.map((i) => i._id);
    const activities = await Activity.find({
      issueId: { $in: issueIds },
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('userId', 'name email avatar')
      .populate('issueId', 'key title')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get comments for recent activity
    const comments = await Comment.find({
      issueId: { $in: issueIds },
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('userId', 'name email avatar')
      .populate('issueId', 'key title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate metrics for last 7 days
    const recentIssues = issues.filter(
      (issue) => new Date(issue.createdAt) >= sevenDaysAgo
    );
    const recentUpdates = activities.filter((a) => a.action === 'updated' || a.action === 'status_changed');
    const recentCreated = recentIssues.length;
    const recentDone = issues.filter(
      (issue) => issue.status === 'done' && new Date(issue.updatedAt) >= sevenDaysAgo
    ).length;
    
    const now = new Date();
    const dueIssues = issues.filter(
      (issue) => issue.dueDate && new Date(issue.dueDate) <= now && issue.status !== 'done'
    ).length;

    // Status breakdown
    const statusBreakdown = {
      todo: issues.filter((i) => i.status === 'todo').length,
      in_progress: issues.filter((i) => i.status === 'in_progress').length,
      in_review: issues.filter((i) => i.status === 'in_review').length,
      done: issues.filter((i) => i.status === 'done').length,
    };

    // Priority breakdown
    const priorityBreakdown = {
      critical: issues.filter((i) => i.priority === 'critical').length,
      high: issues.filter((i) => i.priority === 'high').length,
      medium: issues.filter((i) => i.priority === 'medium').length,
      low: issues.filter((i) => i.priority === 'low').length,
    };

    // Type breakdown
    const typeBreakdown = {
      task: issues.filter((i) => i.type === 'task').length,
      bug: issues.filter((i) => i.type === 'bug').length,
      story: issues.filter((i) => i.type === 'story').length,
      epic: issues.filter((i) => i.type === 'epic').length,
    };

    // Team workload (by assignee)
    const workloadByAssignee = {};
    issues.forEach((issue) => {
      if (issue.assignee) {
        const assigneeId = issue.assignee._id || issue.assignee;
        const assigneeName = issue.assignee.name || 'Unknown';
        if (!workloadByAssignee[assigneeId]) {
          workloadByAssignee[assigneeId] = {
            id: assigneeId,
            name: assigneeName,
            avatar: issue.assignee.avatar,
            count: 0,
          };
        }
        workloadByAssignee[assigneeId].count++;
      }
    });

    const unassignedCount = issues.filter((i) => !i.assignee).length;
    const workload = [
      ...Object.values(workloadByAssignee),
      ...(unassignedCount > 0 ? [{ id: 'unassigned', name: 'Unassigned', count: unassignedCount }] : []),
    ];

    // Combine activities and comments for recent activity
    const recentActivity = [
      ...activities.map((a) => ({
        ...a.toObject(),
        type: 'activity',
        timestamp: a.createdAt,
      })),
      ...comments.map((c) => ({
        _id: c._id,
        type: 'comment',
        userId: c.userId,
        issueId: c.issueId,
        content: c.content,
        timestamp: c.createdAt,
        action: 'commented',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);

    res.json({
      metrics: {
        done: recentDone,
        updated: recentUpdates.length,
        created: recentCreated,
        due: dueIssues,
      },
      statusBreakdown,
      priorityBreakdown,
      typeBreakdown,
      workload,
      recentActivity,
      totalIssues: issues.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

