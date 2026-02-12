import Activity from '../models/Activity.js';
import WorkLog from '../models/WorkLog.js';

// @desc    Get activities for an issue
// @route   GET /api/issues/:issueId/activities
// @access  Private
export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ issueId: req.params.issueId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    // Get work logs as activities
    const workLogs = await WorkLog.find({ issueId: req.params.issueId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    // Combine and format activities
    const allActivities = [
      ...activities.map((a) => ({
        ...a.toObject(),
        type: 'activity',
      })),
      ...workLogs.map((w) => ({
        _id: w._id,
        issueId: w.issueId,
        userId: w.userId,
        action: 'time_logged',
        field: 'time_spent',
        newValue: `${w.timeSpent} minutes`,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        type: 'worklog',
        timeSpent: w.timeSpent,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allActivities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

