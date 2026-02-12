import Issue from '../models/Issue.js';

export const generateIssueKey = async (projectKey) => {
  const lastIssue = await Issue.findOne({ key: new RegExp(`^${projectKey}-`) })
    .sort({ key: -1 })
    .exec();

  if (!lastIssue) {
    return `${projectKey}-1`;
  }

  const lastNumber = parseInt(lastIssue.key.split('-')[1]);
  return `${projectKey}-${lastNumber + 1}`;
};

