import Project from '../models/Project.js';

/**
 * Middleware to check if user has access to a project
 * Adds project to req.project if access is granted
 */
export const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Admin and Manager have access to all projects
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      req.project = project;
      return next();
    }

    // Check if user is project lead or member
    const isLead = project.lead.toString() === req.user._id.toString();
    const isMember = project.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isLead && !isMember) {
      return res.status(403).json({
        message: 'You do not have access to this project',
      });
    }

    req.project = project;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware to check if user is project lead, admin, or manager
 */
export const checkProjectLead = async (req, res, next) => {
  try {
    if (!req.project) {
      return res.status(500).json({ message: 'Project not found in request' });
    }

    const isAdmin = req.user.role === 'admin';
    const isManager = req.user.role === 'manager';
    const isLead = req.project.lead.toString() === req.user._id.toString();

    if (!isAdmin && !isManager && !isLead) {
      return res.status(403).json({
        message: 'Only project lead, manager, or admin can perform this action',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

