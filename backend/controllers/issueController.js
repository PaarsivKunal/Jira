import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { generateIssueKey } from '../utils/generateIssueKey.js';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination.js';
import { CONSTANTS } from '../config/constants.js';
import { sendTeamsNotification } from '../services/teamsService.js';
import { sendIssueNotification, sendAssignmentNotification, sendIssueCreatedNotification } from '../utils/emailService.js';

const { ROLES, ISSUE } = CONSTANTS;

/**
 * Check if user has permission to modify an issue
 * Users can modify if they are:
 * - Admin
 * - Manager (can modify issues assigned to employees)
 * - Project lead or member
 * - Issue assignee
 * - Issue reporter
 */
const canModifyIssue = async (issue, userId, userRole) => {
  // Admin can modify any issue
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  // Manager can modify issues assigned to employees (non-admin, non-manager users)
  if (userRole === ROLES.MANAGER) {
    // Get assignees (from both old assignee field and new assignees array)
    const assigneeIds = [];
    if (issue.assignee) {
      assigneeIds.push(issue.assignee.toString());
    }
    if (issue.assignees && issue.assignees.length > 0) {
      issue.assignees.forEach(assignee => {
        const assigneeId = assignee._id ? assignee._id.toString() : assignee.toString();
        if (!assigneeIds.includes(assigneeId)) {
          assigneeIds.push(assigneeId);
        }
      });
    }

    if (assigneeIds.length > 0) {
      // Check if any assignee is an employee (not admin or manager)
      const assignees = await User.find({ _id: { $in: assigneeIds } }).select('role');
      const hasEmployeeAssignee = assignees.some(
        user => user.role !== ROLES.ADMIN && user.role !== ROLES.MANAGER
      );
      if (hasEmployeeAssignee) {
        return true; // Manager can modify issues assigned to employees
      }
    }
  }

  // Get project to check membership
  const project = await Project.findById(issue.projectId);
  if (!project) {
    return false;
  }

  // Check if user is project lead or member
  const isLead = project.lead.toString() === userId.toString();
  const isMember = project.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );

    // Check if user is assignee or reporter
    const isAssignee = issue.assignee?.toString() === userId.toString();
    const isInAssignees = issue.assignees?.some(
      (assigneeId) => assigneeId.toString() === userId.toString()
    ) || false;
    const isReporter = issue.reporter.toString() === userId.toString();

    return isLead || isMember || isAssignee || isInAssignees || isReporter;
};

// @desc    Get all issues
// @route   GET /api/issues
// @access  Private
export const getIssues = async (req, res) => {
  try {
    const { projectId, status, assignee } = req.query;
    const { page, limit, skip } = getPaginationParams(req);
    const query = {};

    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (assignee) {
      // Support both old assignee field and new assignees array
      query.$or = [
        { assignee: assignee },
        { assignees: assignee }
      ];
    }
    // Allow filtering by sprintId (or 'null' for backlog)
    if (req.query.sprintId) {
      query.sprintId = req.query.sprintId === 'null' ? null : req.query.sprintId;
    }

    // Filter by project access if not admin or manager
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MANAGER && projectId) {
      const project = await Project.findById(projectId);
      if (project) {
        const isLead = project.lead.toString() === req.user._id.toString();
        const isMember = project.members.some(
          (memberId) => memberId.toString() === req.user._id.toString()
        );
        // Allow access if user is lead/member OR if they have issues assigned in this project
        if (!isLead && !isMember) {
          // Check if user has any assigned issues in this project
          const assignedIssuesCount = await Issue.countDocuments({
            projectId: projectId,
            $or: [
              { assignee: req.user._id },
              { assignees: req.user._id }
            ]
          });
          
          // If no assigned issues, deny access
          if (assignedIssuesCount === 0) {
            return res.status(403).json({ message: 'Access denied to this project' });
          }
          // If they have assigned issues, allow access but filter to only show their assigned issues
          query.$or = [
            { assignee: req.user._id },
            { assignees: req.user._id }
          ];
        }
      }
    } else if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.MANAGER) {
      // If no project specified and not admin/manager, show:
      // 1. Issues from projects where user is lead/member
      // 2. Issues assigned to the user (even if not a project member)
      const allowedProjects = await Project.find({
        $or: [
          { lead: req.user._id },
          { members: req.user._id }
        ]
      }).select('_id');

      const allowedProjectIds = allowedProjects.map(p => p._id);
      
      // Build query to include:
      // - Issues from allowed projects, OR
      // - Issues assigned to the user (in assignee or assignees)
      query.$or = [
        { projectId: { $in: allowedProjectIds } },
        { assignee: req.user._id },
        { assignees: req.user._id }
      ];
    } else if (req.user.role === ROLES.MANAGER) {
      // Manager sees all issues assigned to employees (non-admin, non-manager users)
      const employees = await User.find({
        role: { $nin: [ROLES.ADMIN, ROLES.MANAGER] }
      }).select('_id');
      
      const employeeIds = employees.map(emp => emp._id);
      
      // Manager sees issues assigned to employees
      query.$or = [
        { assignee: { $in: employeeIds } },
        { assignees: { $in: employeeIds } }
      ];
    }


    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(createPaginationResponse(issues, page, limit, total));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Private
export const getIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate({
        path: 'linkedIssues.issueId',
        populate: [
          { path: 'assignee', select: 'name email avatar' },
          { path: 'reporter', select: 'name email avatar' },
          { path: 'projectId', select: 'name key' },
        ],
      })
      .lean();

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Get child issues
    const childIssues = await Issue.find({ parentIssue: req.params.id })
      .populate('assignee', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar')
      .populate('projectId', 'name key')
      .sort({ createdAt: 1 })
      .lean();

    const issueObj = issue; // issue is already a POJO due to .lean()
    issueObj.childIssues = childIssues;

    res.json(issueObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create issue
// @route   POST /api/issues
// @access  Private
export const createIssue = async (req, res) => {
  try {
    const { projectId, title, description, type, priority, assignee, assignees, labels, dueDate } = req.body;

    const projectData = await Project.findById(projectId);

    if (!projectData) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const key = await generateIssueKey(projectData.key);

    // Handle assignees: support both old assignee (single) and new assignees (array)
    let finalAssignees = [];
    if (assignees && Array.isArray(assignees)) {
      finalAssignees = assignees.filter(Boolean);
    } else if (assignee) {
      finalAssignees = [assignee];
    }

    const issueData = {
      projectId,
      key,
      title,
      description,
      type: type || ISSUE.TYPE.TASK,
      priority: priority || ISSUE.PRIORITY.MEDIUM,
      assignees: finalAssignees,
      reporter: req.user._id,
      labels: labels || [],
      dueDate,
    };

    // Keep assignee for backward compatibility (use first assignee if exists)
    if (finalAssignees.length > 0) {
      issueData.assignee = finalAssignees[0];
    }

    const issue = await Issue.create(issueData);

    // Create activity
    await Activity.create({
      issueId: issue._id,
      userId: req.user._id,
      action: 'created',
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Send notifications
    await Promise.all([
      sendTeamsNotification(populatedIssue, 'created'),
      sendIssueNotification(populatedIssue, 'created')
    ]);

    // Send email to all assignees if issue was assigned during creation
    const assigneesToNotify = populatedIssue.assignees && populatedIssue.assignees.length > 0 
      ? populatedIssue.assignees 
      : (populatedIssue.assignee ? [populatedIssue.assignee] : []);
    
    assigneesToNotify.forEach((assignee) => {
      if (assignee?.email) {
        sendIssueCreatedNotification(req.user._id, populatedIssue, assignee).catch((error) => {
          console.error('Failed to send issue creation notification:', error);
        });
      }
    });

    res.status(201).json(populatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update issue
// @route   PUT /api/issues/:id
// @access  Private
export const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check authorization
    const hasPermission = await canModifyIssue(issue, req.user._id, req.user.role);
    if (!hasPermission) {
      return res.status(403).json({
        message: 'You do not have permission to modify this issue'
      });
    }

    const oldStatus = issue.status;
    // Extract old assignees - handle both ObjectId and populated user objects
    const oldAssignees = issue.assignees?.map(a => {
      if (a && typeof a === 'object' && a._id) {
        return a._id.toString();
      }
      return a?.toString() || a.toString();
    }).filter(Boolean) || [];
    // Also check old assignee field for backward compatibility
    if (issue.assignee && !oldAssignees.includes(issue.assignee.toString())) {
      oldAssignees.push(issue.assignee.toString());
    }
    const oldAssignee = issue.assignee?.toString();
    const oldPriority = issue.priority;
    const oldDescription = issue.description;

    // Handle assignees update: support both old assignee (single) and new assignees (array)
    let updateData = { ...req.body };
    if (updateData.assignees !== undefined) {
      // If assignees array is provided, use it
      updateData.assignees = Array.isArray(updateData.assignees) 
        ? updateData.assignees.filter(Boolean) 
        : [];
      // Keep assignee for backward compatibility (use first assignee if exists)
      updateData.assignee = updateData.assignees.length > 0 ? updateData.assignees[0] : null;
    } else if (updateData.assignee !== undefined) {
      // If only assignee is provided, convert to assignees array
      updateData.assignees = updateData.assignee ? [updateData.assignee] : [];
    }

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Create activity for status change
    if (req.body.status && req.body.status !== oldStatus) {
      await Activity.create({
        issueId: issue._id,
        userId: req.user._id,
        action: 'status_changed',
        field: 'status',
        oldValue: oldStatus,
        newValue: req.body.status,
      });
    }

    // Create activity and send email for assignment change
    const newAssignees = updatedIssue.assignees?.map(a => a?._id?.toString() || a.toString()) || [];
    const assigneesChanged = JSON.stringify(newAssignees.sort()) !== JSON.stringify(oldAssignees.sort());
    
    if (assigneesChanged) {
      await Activity.create({
        issueId: issue._id,
        userId: req.user._id,
        action: 'assigned',
        field: 'assignees',
        oldValue: oldAssignees.join(', '),
        newValue: newAssignees.join(', '),
      });

      // Send assignment notification email to newly assigned users
      const assigneesToNotify = updatedIssue.assignees && updatedIssue.assignees.length > 0 
        ? updatedIssue.assignees 
        : (updatedIssue.assignee ? [updatedIssue.assignee] : []);
      
      assigneesToNotify.forEach((assignee) => {
        if (assignee?.email) {
          const wasPreviouslyAssigned = oldAssignees.includes(assignee._id?.toString() || assignee.toString());
          if (!wasPreviouslyAssigned) {
            sendAssignmentNotification(req.user._id, updatedIssue, assignee, req.user).catch((error) => {
              console.error('Failed to send assignment notification:', error);
            });
          }
        }
      });
    }

    // Create activity for priority change
    if (req.body.priority && req.body.priority !== oldPriority) {
      await Activity.create({
        issueId: issue._id,
        userId: req.user._id,
        action: 'updated',
        field: 'priority',
        oldValue: oldPriority,
        newValue: req.body.priority,
      });
    }

    // Create activity for description change
    if (req.body.description !== undefined && req.body.description !== oldDescription) {
      await Activity.create({
        issueId: issue._id,
        userId: req.user._id,
        action: 'updated',
        field: 'description',
      });
    }

    // Send notifications
    await Promise.all([
      sendTeamsNotification(updatedIssue, 'updated'),
      sendIssueNotification(updatedIssue, 'updated')
    ]);

    res.json(updatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private
export const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check authorization - only admin, project lead, or reporter can delete
    const project = await Project.findById(issue.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isLead = project.lead.toString() === req.user._id.toString();
    const isReporter = issue.reporter.toString() === req.user._id.toString();

    if (!isAdmin && !isLead && !isReporter) {
      return res.status(403).json({
        message: 'You do not have permission to delete this issue'
      });
    }

    await Issue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Issue removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update issue status
// @route   PATCH /api/issues/:id/status
// @access  Private
export const updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check authorization
    const hasPermission = await canModifyIssue(issue, req.user._id, req.user.role);
    if (!hasPermission) {
      return res.status(403).json({
        message: 'You do not have permission to update this issue'
      });
    }

    const oldStatus = issue.status;
    issue.status = status;
    await issue.save();

    // Create activity
    await Activity.create({
      issueId: issue._id,
      userId: req.user._id,
      action: 'status_changed',
      field: 'status',
      oldValue: oldStatus,
      newValue: status,
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('projectId', 'name key')
      .populate('assignee', 'name email avatar')
      .populate('reporter', 'name email avatar');

    // Send notifications
    await Promise.all([
      sendTeamsNotification(populatedIssue, 'updated'), // Status change is an update
      sendIssueNotification(populatedIssue, 'status updated')
    ]);

    res.json(populatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
