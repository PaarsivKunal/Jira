import mongoose from 'mongoose';

const projectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
    },
    key: {
      type: String,
      required: [true, 'Please add a project key'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [10, 'Project key must be 10 characters or less'],
    },
    description: {
      type: String,
      default: '',
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
projectSchema.index({ lead: 1 }); // For finding projects by lead
projectSchema.index({ members: 1 }); // For finding projects by member
projectSchema.index({ createdAt: -1 }); // For sorting by creation date

const Project = mongoose.model('Project', projectSchema);

export default Project;

