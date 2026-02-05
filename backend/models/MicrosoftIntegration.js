import mongoose from 'mongoose';

const microsoftIntegrationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    integrationType: {
      type: String,
      enum: ['outlook', 'teams', 'both'],
      required: true,
    },
    outlook: {
      accessToken: {
        type: String,
        required: false,
      },
      refreshToken: {
        type: String,
        required: false,
      },
      expiresAt: {
        type: Date,
        required: false,
      },
      email: {
        type: String,
        required: false,
      },
      isConnected: {
        type: Boolean,
        default: false,
      },
    },
    teams: {
      accessToken: {
        type: String,
        required: false,
      },
      refreshToken: {
        type: String,
        required: false,
      },
      expiresAt: {
        type: Date,
        required: false,
      },
      tenantId: {
        type: String,
        required: false,
      },
      teamId: {
        type: String,
        required: false,
      },
      channelId: {
        type: String,
        required: false,
      },
      webhookUrl: {
        type: String,
        required: false,
      },
      isConnected: {
        type: Boolean,
        default: false,
      },
    },
    settings: {
      sendEmailNotifications: {
        type: Boolean,
        default: true,
      },
      sendTeamsNotifications: {
        type: Boolean,
        default: true,
      },
      notifyOnIssueCreate: {
        type: Boolean,
        default: true,
      },
      notifyOnIssueUpdate: {
        type: Boolean,
        default: true,
      },
      notifyOnComment: {
        type: Boolean,
        default: true,
      },
      notifyOnStatusChange: {
        type: Boolean,
        default: true,
      },
      notifyOnAssignment: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

microsoftIntegrationSchema.index({ userId: 1, integrationType: 1 });

const MicrosoftIntegration = mongoose.model('MicrosoftIntegration', microsoftIntegrationSchema);

export default MicrosoftIntegration;

