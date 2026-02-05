import mongoose from 'mongoose';

const shortcutSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: null, // Will be extracted from emoji in name or generated
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
shortcutSchema.index({ userId: 1 });

const Shortcut = mongoose.model('Shortcut', shortcutSchema);

export default Shortcut;

