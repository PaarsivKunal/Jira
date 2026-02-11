/**
 * Utility functions for handling assignees
 * Centralizes logic for backward compatibility between assignee and assignees fields
 */

/**
 * Extract assignee IDs from issue (handles both old assignee and new assignees array)
 * @param {Object} issue - Issue object
 * @returns {Array<string>} Array of assignee IDs
 */
export const getAssigneeIds = (issue) => {
  const assigneeIds = [];
  
  // Check new assignees array
  if (issue.assignees && Array.isArray(issue.assignees) && issue.assignees.length > 0) {
    issue.assignees.forEach(assignee => {
      const assigneeId = assignee?._id ? assignee._id.toString() : assignee.toString();
      if (!assigneeIds.includes(assigneeId)) {
        assigneeIds.push(assigneeId);
      }
    });
  }
  
  // Check old assignee field for backward compatibility
  if (issue.assignee) {
    const assigneeId = issue.assignee.toString();
    if (!assigneeIds.includes(assigneeId)) {
      assigneeIds.push(assigneeId);
    }
  }
  
  return assigneeIds;
};

/**
 * Get assignees list for display (handles both populated and non-populated)
 * @param {Object} issue - Issue object
 * @returns {Array} Array of assignee objects or IDs
 */
export const getAssigneesList = (issue) => {
  if (issue.assignees && Array.isArray(issue.assignees) && issue.assignees.length > 0) {
    return issue.assignees;
  }
  if (issue.assignee) {
    return [issue.assignee];
  }
  return [];
};

/**
 * Normalize assignees input (converts single assignee to array)
 * @param {string|Array} assignees - Assignees input (can be single ID or array)
 * @param {string} assignee - Legacy single assignee field
 * @returns {Array<string>} Normalized array of assignee IDs
 */
export const normalizeAssignees = (assignees, assignee = null) => {
  if (assignees !== undefined) {
    if (Array.isArray(assignees)) {
      return assignees.filter(Boolean);
    }
    return assignees ? [assignees] : [];
  }
  if (assignee !== undefined) {
    return assignee ? [assignee] : [];
  }
  return [];
};

/**
 * Check if user is assigned to issue
 * @param {Object} issue - Issue object
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is assigned
 */
export const isUserAssigned = (issue, userId) => {
  const assigneeIds = getAssigneeIds(issue);
  return assigneeIds.includes(userId.toString());
};

