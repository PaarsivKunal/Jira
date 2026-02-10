import mongoose from 'mongoose';

const issueSchema = mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['bug', 'task', 'story', 'epic'],
      default: 'task',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Keep assignee for backward compatibility (will be deprecated)
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
    },
    timeSpent: {
      type: Number,
      default: 0, // in hours
    },
    remainingEstimate: {
      type: Number,
      default: 0, // in hours
    },
    parentIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    linkedIssues: [
      {
        issueId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Issue',
        },
        linkType: {
          type: String,
          enum: ['blocks', 'is_blocked_by', 'relates_to', 'duplicates', 'duplicated_by'],
          default: 'relates_to',
        },
      },
    ],
    // Approval workflow fields
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', null],
      default: null,
    },
    proofAttachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    approvalComment: {
      type: String,
      trim: true,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionComment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
issueSchema.index({ projectId: 1, status: 1 }); // For filtering by project and status
issueSchema.index({ assignee: 1 }); // For finding issues assigned to a user (backward compatibility)
issueSchema.index({ assignees: 1 }); // For finding issues assigned to users
issueSchema.index({ reporter: 1, createdAt: -1 }); // For finding issues reported by a user
issueSchema.index({ projectId: 1, status: 1, assignee: 1 }); // Compound index for common queries
issueSchema.index({ projectId: 1, status: 1, assignees: 1 }); // Compound index for multiple assignees
issueSchema.index({ projectId: 1, type: 1 }); // For filtering by project and type
issueSchema.index({ projectId: 1, priority: 1 }); // For filtering by project and priority
issueSchema.index({ parentIssue: 1 }); // For finding child issues
issueSchema.index({ createdAt: -1 }); // For sorting by creation date
issueSchema.index({ dueDate: 1 }); // For finding issues by due date

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;

