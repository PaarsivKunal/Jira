import Comment from '../models/Comment.js';
import Issue from '../models/Issue.js';
import Activity from '../models/Activity.js';
import { sendCommentNotification } from '../utils/emailService.js';
import { sendErrorResponse } from '../utils/errorResponse.js';

// @desc    Get comments for an issue
// @route   GET /api/issues/:issueId/comments
// @access  Private
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ issueId: req.params.issueId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to fetch comments', req.id, process.env.NODE_ENV === 'development' ? { error: error.message } : null);
  }
};

// @desc    Create comment
// @route   POST /api/issues/:issueId/comments
// @access  Private
export const createComment = async (req, res) => {
  try {
    const { content } = req.body;

    // Get the issue first to check if it exists
    const issue = await Issue.findById(req.params.issueId)
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const comment = await Comment.create({
      issueId: req.params.issueId,
      userId: req.user._id,
      content,
    });

    // Create activity
    await Activity.create({
      issueId: req.params.issueId,
      userId: req.user._id,
      action: 'commented',
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'name email avatar');

    // Send email notification to relevant users (async, don't wait)
    sendCommentNotification(issue, populatedComment, req.user).catch((error) => {
      console.error('Failed to send comment notification:', error);
    });

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io) {
      const projectId = issue.projectId._id || issue.projectId;
      io.to(`project-${projectId}`).emit('comment:created', populatedComment);
    }

    res.status(201).json(populatedComment);
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to create comment', req.id, process.env.NODE_ENV === 'development' ? { error: error.message } : null);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content },
      { new: true, runValidators: true }
    ).populate('userId', 'name email avatar');

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io) {
      const issue = await Issue.findById(comment.issueId);
      if (issue) {
        const projectId = issue.projectId._id || issue.projectId;
        io.to(`project-${projectId}`).emit('comment:updated', updatedComment);
      }
    }

    res.json(updatedComment);
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to update comment', req.id, process.env.NODE_ENV === 'development' ? { error: error.message } : null);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (
      comment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Get issue before deleting to emit event
    const issue = await Issue.findById(comment.issueId);
    
    await Comment.findByIdAndDelete(req.params.id);

    // Emit Socket.io event for real-time updates
    const io = req.app.get('io');
    if (io && issue) {
      const projectId = issue.projectId._id || issue.projectId;
      io.to(`project-${projectId}`).emit('comment:deleted', { commentId: req.params.id, issueId: comment.issueId });
    }

    res.json({ message: 'Comment removed' });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to delete comment', req.id, process.env.NODE_ENV === 'development' ? { error: error.message } : null);
  }
};

