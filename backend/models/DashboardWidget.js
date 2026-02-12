import mongoose from 'mongoose';

const dashboardWidgetSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'issue_distribution',
        'team_velocity',
        'burndown',
        'activity_feed',
        'kpi_summary',
        'recent_issues',
        'workload_chart',
      ],
    },
    config: {
      projectId: mongoose.Schema.Types.ObjectId,
      sprintId: mongoose.Schema.Types.ObjectId,
      period: {
        type: String,
        enum: ['day', 'week', 'month', 'quarter', 'year'],
        default: 'week',
      },
      size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      refreshInterval: {
        type: Number,
        default: 300000, // 5 minutes in milliseconds
      },
    },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      w: { type: Number, default: 4 },
      h: { type: Number, default: 3 },
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

dashboardWidgetSchema.index({ userId: 1 });

const DashboardWidget = mongoose.model('DashboardWidget', dashboardWidgetSchema);

export default DashboardWidget;

