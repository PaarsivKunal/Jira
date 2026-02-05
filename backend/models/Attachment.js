import mongoose from 'mongoose';

const attachmentSchema = mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: false,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true, // in bytes
    },
    path: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    thumbnail: {
      type: String, // URL to thumbnail if image
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
attachmentSchema.index({ issueId: 1 });
attachmentSchema.index({ projectId: 1 });
attachmentSchema.index({ uploadedBy: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

export default Attachment;

