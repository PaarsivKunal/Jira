import DashboardWidget from '../models/DashboardWidget.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import Sprint from '../models/Sprint.js';
import Activity from '../models/Activity.js';

// @desc    Get user dashboard widgets
// @route   GET /api/dashboard/widgets
// @access  Private
export const getWidgets = async (req, res) => {
  try {
    const widgets = await DashboardWidget.find({ userId: req.user._id, isVisible: true })
      .populate('config.projectId', 'name key')
      .populate('config.sprintId', 'name status')
      .sort({ 'position.y': 1, 'position.x': 1 });

    res.json(widgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get widget data
// @route   GET /api/dashboard/widgets/:id/data
// @access  Private
export const getWidgetData = async (req, res) => {
  try {
    const widget = await DashboardWidget.findById(req.params.id);

    if (!widget) {
      return res.status(404).json({ message: 'Widget not found' });
    }

    if (widget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let data = {};

    switch (widget.type) {
      case 'issue_distribution':
        const projectId = widget.config.projectId;
        const query = projectId ? { projectId } : {};
        const issues = await Issue.find(query);
        const distribution = {
          todo: issues.filter(i => i.status === 'todo').length,
          in_progress: issues.filter(i => i.status === 'in_progress').length,
          in_review: issues.filter(i => i.status === 'in_review').length,
          done: issues.filter(i => i.status === 'done').length,
        };
        data = distribution;
        break;

      case 'team_velocity':
        const sprints = await Sprint.find({ projectId: widget.config.projectId })
          .sort({ startDate: -1 })
          .limit(5);
        const velocityData = sprints.map(sprint => ({
          sprintName: sprint.name,
          completed: 0, // Would need to calculate from issues
        }));
        data = { velocityData };
        break;

      case 'recent_issues':
        const recentIssues = await Issue.find({ projectId: widget.config.projectId })
          .populate('assignee', 'name avatar')
          .sort({ createdAt: -1 })
          .limit(5);
        data = { issues: recentIssues };
        break;

      case 'activity_feed':
        const activities = await Activity.find()
          .populate('userId', 'name avatar')
          .populate('issueId', 'key title')
          .sort({ createdAt: -1 })
          .limit(10);
        data = { activities };
        break;

      default:
        data = { message: 'Widget type not implemented' };
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create widget
// @route   POST /api/dashboard/widgets
// @access  Private
export const createWidget = async (req, res) => {
  try {
    const { type, config, position } = req.body;

    const widget = await DashboardWidget.create({
      userId: req.user._id,
      type,
      config: config || {},
      position: position || { x: 0, y: 0, w: 4, h: 3 },
    });

    const populatedWidget = await DashboardWidget.findById(widget._id)
      .populate('config.projectId', 'name key')
      .populate('config.sprintId', 'name status');

    res.status(201).json(populatedWidget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update widget
// @route   PUT /api/dashboard/widgets/:id
// @access  Private
export const updateWidget = async (req, res) => {
  try {
    const widget = await DashboardWidget.findById(req.params.id);

    if (!widget) {
      return res.status(404).json({ message: 'Widget not found' });
    }

    if (widget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedWidget = await DashboardWidget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('config.projectId', 'name key')
      .populate('config.sprintId', 'name status');

    res.json(updatedWidget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete widget
// @route   DELETE /api/dashboard/widgets/:id
// @access  Private
export const deleteWidget = async (req, res) => {
  try {
    const widget = await DashboardWidget.findById(req.params.id);

    if (!widget) {
      return res.status(404).json({ message: 'Widget not found' });
    }

    if (widget.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await DashboardWidget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Widget removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

