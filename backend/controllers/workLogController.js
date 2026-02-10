import WorkLog from '../models/WorkLog.js';
import Issue from '../models/Issue.js';
import Activity from '../models/Activity.js';

// @desc    Get work logs for an issue
// @route   GET /api/issues/:issueId/worklogs
// @access  Private
export const getWorkLogs = async (req, res) => {
  try {
    const workLogs = await WorkLog.find({ issueId: req.params.issueId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(workLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create work log
// @route   POST /api/issues/:issueId/worklogs
// @access  Private
export const createWorkLog = async (req, res) => {
  try {
    const { timeSpent, description, started } = req.body;
    const issue = await Issue.findById(req.params.issueId);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const workLog = await WorkLog.create({
      issueId: req.params.issueId,
      userId: req.user._id,
      timeSpent, // in minutes
      description,
      started: started || new Date(),
    });

    // Update issue time spent
    issue.timeSpent = (issue.timeSpent || 0) + timeSpent / 60; // Convert minutes to hours
    await issue.save();

    await Activity.create({
      issueId: req.params.issueId,
      userId: req.user._id,
      action: 'time_logged',
      field: 'time_spent',
      newValue: `${timeSpent} minutes`,
    });

    const populatedWorkLog = await WorkLog.findById(workLog._id).populate(
      'userId',
      'name email avatar'
    );

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io) {
      const projectId = issue.projectId._id || issue.projectId;
      io.to(`project-${projectId}`).emit('worklog:created', populatedWorkLog);
    }

    res.status(201).json(populatedWorkLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update work log
// @route   PUT /api/worklogs/:id
// @access  Private
export const updateWorkLog = async (req, res) => {
  try {
    const workLog = await WorkLog.findById(req.params.id);

    if (!workLog) {
      return res.status(404).json({ message: 'Work log not found' });
    }

    // Check ownership
    if (workLog.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const oldTimeSpent = workLog.timeSpent;
    const updatedWorkLog = await WorkLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'name email avatar');

    // Update issue time spent
    let issue = null;
    if (req.body.timeSpent) {
      issue = await Issue.findById(workLog.issueId);
      issue.timeSpent = (issue.timeSpent || 0) - oldTimeSpent / 60 + req.body.timeSpent / 60;
      await issue.save();
    } else {
      issue = await Issue.findById(workLog.issueId);
    }

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io && issue) {
      const projectId = issue.projectId._id || issue.projectId;
      io.to(`project-${projectId}`).emit('worklog:updated', updatedWorkLog);
    }

    res.json(updatedWorkLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete work log
// @route   DELETE /api/worklogs/:id
// @access  Private
export const deleteWorkLog = async (req, res) => {
  try {
    const workLog = await WorkLog.findById(req.params.id);

    if (!workLog) {
      return res.status(404).json({ message: 'Work log not found' });
    }

    // Check ownership
    if (
      workLog.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update issue time spent
    const issue = await Issue.findById(workLog.issueId);
    issue.timeSpent = Math.max(0, (issue.timeSpent || 0) - workLog.timeSpent / 60);
    await issue.save();

    await WorkLog.findByIdAndDelete(req.params.id);

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io && issue) {
      const projectId = issue.projectId._id || issue.projectId;
      io.to(`project-${projectId}`).emit('worklog:deleted', { workLogId: req.params.id, issueId: workLog.issueId });
    }

    res.json({ message: 'Work log removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

