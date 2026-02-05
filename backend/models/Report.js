import mongoose from 'mongoose';

const reportSchema = mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'pie_chart',
        'average_age',
        'created_vs_resolved',
        'recently_created',
        'resolution_time',
        'single_level_group_by',
        'time_tracking',
        'user_workload',
        'version_workload',
        'workload_pie_chart',
      ],
      required: true,
    },
    config: {
      filterId: String,
      groupBy: String, // assignee, status, type, priority, etc.
      dateRange: {
        start: Date,
        end: Date,
      },
      period: {
        type: String,
        enum: ['day', 'week', 'month', 'quarter', 'year'],
        default: 'week',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;

