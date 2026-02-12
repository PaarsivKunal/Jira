import mongoose from 'mongoose';

const workLogSchema = mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timeSpent: {
      type: Number,
      required: true, // in minutes
    },
    description: {
      type: String,
      default: '',
    },
    started: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const WorkLog = mongoose.model('WorkLog', workLogSchema);

export default WorkLog;

