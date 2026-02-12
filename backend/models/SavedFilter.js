import mongoose from 'mongoose';

const savedFilterSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    filters: {
      status: [String],
      type: [String],
      priority: [String],
      assignee: [mongoose.Schema.Types.ObjectId],
      reporter: [mongoose.Schema.Types.ObjectId],
      labels: [String],
    },
    dateRange: {
      start: Date,
      end: Date,
    },
    filterLogic: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

savedFilterSchema.index({ createdBy: 1 });
savedFilterSchema.index({ projectId: 1 });

const SavedFilter = mongoose.model('SavedFilter', savedFilterSchema);

export default SavedFilter;

