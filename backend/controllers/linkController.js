import Issue from '../models/Issue.js';
import Activity from '../models/Activity.js';

// @desc    Get linked issues
// @route   GET /api/issues/:id/links
// @access  Private
export const getLinkedIssues = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate({
      path: 'linkedIssues.issueId',
      populate: [
        { path: 'assignee', select: 'name email avatar' },
        { path: 'reporter', select: 'name email avatar' },
        { path: 'projectId', select: 'name key' },
      ],
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue.linkedIssues || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Link issues
// @route   POST /api/issues/:id/links
// @access  Private
export const linkIssues = async (req, res) => {
  try {
    const { linkedIssueId, linkType } = req.body;

    const issue = await Issue.findById(req.params.id);
    const linkedIssue = await Issue.findById(linkedIssueId);

    if (!issue || !linkedIssue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if link already exists
    const existingLink = issue.linkedIssues.find(
      (link) => link.issueId.toString() === linkedIssueId
    );

    if (existingLink) {
      return res.status(400).json({ message: 'Issues already linked' });
    }

    issue.linkedIssues.push({
      issueId: linkedIssueId,
      linkType: linkType || 'relates_to',
    });

    await issue.save();

    await Activity.create({
      issueId: req.params.id,
      userId: req.user._id,
      action: 'linked',
      field: 'link',
      newValue: `${linkType}: ${linkedIssueId}`,
    });

    const populatedIssue = await Issue.findById(req.params.id).populate({
      path: 'linkedIssues.issueId',
      populate: [
        { path: 'assignee', select: 'name email avatar' },
        { path: 'reporter', select: 'name email avatar' },
        { path: 'projectId', select: 'name key' },
      ],
    });

    res.json(populatedIssue.linkedIssues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unlink issues
// @route   DELETE /api/issues/:id/links/:linkId
// @access  Private
export const unlinkIssues = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.linkedIssues = issue.linkedIssues.filter(
      (link) => link._id.toString() !== req.params.linkId
    );

    await issue.save();
    res.json({ message: 'Link removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

