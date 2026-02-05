import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import { generateIssueKey } from '../utils/generateIssueKey.js';

// @desc    Get child issues
// @route   GET /api/issues/:id/children
// @access  Private
export const getChildIssues = async (req, res) => {
  try {
    const children = await Issue.find({ parentIssue: req.params.id })
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(children);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create child issue
// @route   POST /api/issues/:id/children
// @access  Private
export const createChildIssue = async (req, res) => {
  try {
    const parentIssue = await Issue.findById(req.params.id);
    if (!parentIssue) {
      return res.status(404).json({ message: 'Parent issue not found' });
    }

    const projectData = await Project.findById(parentIssue.projectId);
    const key = await generateIssueKey(projectData.key);

    const childIssue = await Issue.create({
      ...req.body,
      projectId: parentIssue.projectId,
      key,
      parentIssue: req.params.id,
      reporter: req.user._id,
    });

    await Activity.create({
      issueId: req.params.id,
      userId: req.user._id,
      action: 'child_added',
      field: 'child_issue',
      newValue: childIssue._id.toString(),
    });

    const populatedIssue = await Issue.findById(childIssue._id)
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    res.status(201).json(populatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

