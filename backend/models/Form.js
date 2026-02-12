import mongoose from 'mongoose';

const formFieldSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'textarea', 'number', 'date', 'select', 'checkbox', 'file'],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  placeholder: String,
  required: {
    type: Boolean,
    default: false,
  },
  options: [String], // For select fields
  validation: {
    min: Number,
    max: Number,
    pattern: String,
  },
});

const formSchema = mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a form name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    fields: [formFieldSchema],
    settings: {
      allowAnonymous: {
        type: Boolean,
        default: false,
      },
      notifyOnSubmit: {
        type: Boolean,
        default: true,
      },
      autoCreateIssue: {
        type: Boolean,
        default: true,
      },
      issueType: {
        type: String,
        enum: ['bug', 'task', 'story', 'epic'],
        default: 'task',
      },
      issueStatus: {
        type: String,
        enum: ['todo', 'in_progress', 'in_review', 'done'],
        default: 'todo',
      },
    },
    shareUrl: {
      type: String,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submissionsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique share URL before saving
formSchema.pre('save', async function (next) {
  if (!this.shareUrl) {
    const randomString = Math.random().toString(36).substring(2, 15);
    this.shareUrl = `form-${randomString}`;
  }
  next();
});

const Form = mongoose.model('Form', formSchema);

export default Form;

