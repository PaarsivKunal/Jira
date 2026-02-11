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
      uppercase: true,
      trim: true,
      maxlength: [10, 'Project key must be 10 characters or less'],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Project must belong to an organization'],
      index: true,
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
    department: {
      type: String,
      enum: ['salesforce', 'web_development', 'mobile_development'],
    },
    technologies: {
      type: [String],
      default: [],
    },
    clouds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
projectSchema.index({ key: 1, organization: 1 }, { unique: true }); // Key unique per organization
projectSchema.index({ organization: 1 }); // For filtering by organization
projectSchema.index({ lead: 1 }); // For finding projects by lead
projectSchema.index({ members: 1 }); // For finding projects by member
projectSchema.index({ createdAt: -1 }); // For sorting by creation date
projectSchema.index({ department: 1 }); // For filtering by department

const Project = mongoose.model('Project', projectSchema);

export default Project;

