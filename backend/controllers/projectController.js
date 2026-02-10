import Project from '../models/Project.js';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination.js';
import { getCache, setCache, clearCache } from '../utils/cache.js';

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);

    // Create a unique cache key based on user and pagination
    const cacheKey = `projects_${req.user._id}_${page}_${limit}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Filter projects based on user role
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin can see all projects
      query = {};
    } else if (req.user.role === 'manager') {
      // Manager sees only projects matching their department
      if (req.user.department) {
        query.department = req.user.department;
      } else {
        // Manager without department sees no projects
        query._id = null; // This will return empty results
      }
    } else {
      // Non-admin/manager users only see projects they're part of
      query.$or = [
        { lead: req.user._id },
        { members: req.user._id },
      ];
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('lead', 'name email avatar department')
      .populate('members', 'name email avatar department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Optimization: Plain JS Objects

    const response = createPaginationResponse(projects, page, limit, total);

    // Cache the response
    setCache(cacheKey, response);

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('lead', 'name email avatar')
      .populate('members', 'name email avatar')
      .lean(); // Optimization

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const { name, key, description, members, department, technologies, clouds } = req.body;

    const projectExists = await Project.findOne({ key });

    if (projectExists) {
      return res.status(400).json({ message: 'Project key already exists' });
    }

    const projectData = {
      name,
      key,
      description,
      lead: req.user._id,
      members: members || [],
    };

    // Add department and related fields
    if (department) {
      projectData.department = department;
      
      if (department === 'salesforce' && clouds && Array.isArray(clouds)) {
        projectData.clouds = clouds;
      } else if ((department === 'web_development' || department === 'mobile_development') && technologies && Array.isArray(technologies)) {
        projectData.technologies = technologies;
      }
    }

    const project = await Project.create(projectData);

    const populatedProject = await Project.findById(project._id)
      .populate('lead', 'name email avatar department')
      .populate('members', 'name email avatar department');

    // Clear cache so new project appears
    clearCache(`projects_${req.user._id}`);

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const updateData = { ...req.body };

    // Handle department and related fields
    if (updateData.department) {
      if (updateData.department === 'salesforce' && updateData.clouds) {
        updateData.clouds = Array.isArray(updateData.clouds) ? updateData.clouds : [];
        updateData.technologies = []; // Clear technologies for Salesforce
      } else if (
        (updateData.department === 'web_development' ||
          updateData.department === 'mobile_development') &&
        updateData.technologies
      ) {
        updateData.technologies = Array.isArray(updateData.technologies) ? updateData.technologies : [];
        updateData.clouds = []; // Clear clouds for web/mobile
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('lead', 'name email avatar department')
      .populate('members', 'name email avatar department')
      .lean();

    // Clear cache
    clearCache(`projects_${req.user._id}`); // Ideally should clear for all affected users

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.findByIdAndDelete(req.params.id);

    // Clear cache
    clearCache(`projects_${req.user._id}`);

    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
