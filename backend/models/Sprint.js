import mongoose from 'mongoose';

const sprintSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        goal: {
            type: String,
            trim: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['future', 'active', 'closed'],
            default: 'future',
        },
    },
    {
        timestamps: true,
    }
);

// Ensure there is only one active sprint per project (optional but good practice)
// sprintSchema.index({ projectId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

const Sprint = mongoose.model('Sprint', sprintSchema);

export default Sprint;
