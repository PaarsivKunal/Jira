import Sprint from '../models/Sprint.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';

// @desc    Get sprints for a project
// @route   GET /api/sprints
// @access  Private
export const getSprints = async (req, res) => {
    try {
        const { projectId, status } = req.query;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        const query = { projectId };
        if (status) {
            query.status = status;
        }

        const sprints = await Sprint.find(query).sort({ startDate: 1, createdAt: 1 });
        res.json(sprints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a sprint
// @route   POST /api/sprints
// @access  Private
export const createSprint = async (req, res) => {
    try {
        const { name, goal, projectId, startDate, endDate } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Authorization check could go here (e.g., only project lead/admin)

        const sprint = await Sprint.create({
            name,
            goal,
            projectId,
            startDate,
            endDate,
        });

        res.status(201).json(sprint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update sprint (e.g., proper Start/Complete)
// @route   PUT /api/sprints/:id
// @access  Private
export const updateSprint = async (req, res) => {
    try {
        const { name, goal, startDate, endDate, status } = req.body;
        const sprint = await Sprint.findById(req.params.id);

        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }

        // Enforce "Active" constraint: only one active sprint per project
        if (status === 'active' && sprint.status !== 'active') {
            const activeSprint = await Sprint.findOne({
                projectId: sprint.projectId,
                status: 'active'
            });
            if (activeSprint) {
                return res.status(400).json({ message: 'There is already an active sprint for this project.' });
            }
        }

        const updatedSprint = await Sprint.findByIdAndUpdate(
            req.params.id,
            {
                name,
                goal,
                startDate,
                endDate,
                status,
            },
            { new: true }
        );

        res.json(updatedSprint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete sprint
// @route   DELETE /api/sprints/:id
// @access  Private
export const deleteSprint = async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }

        // Move issues back to backlog (null sprintId)
        await Issue.updateMany(
            { sprintId: sprint._id },
            { $set: { sprintId: null } }
        );

        await Sprint.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sprint removed and issues moved to backlog' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
