import Form from '../models/Form.js';
import FormSubmission from '../models/FormSubmission.js';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import { generateIssueKey } from '../utils/generateIssueKey.js';

// @desc    Get all forms for a project
// @route   GET /api/projects/:projectId/forms
// @access  Private
export const getForms = async (req, res) => {
  try {
    const forms = await Form.find({ projectId: req.params.projectId })
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single form
// @route   GET /api/forms/:id
// @access  Private
export const getForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('projectId', 'name key');

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get form by share URL
// @route   GET /api/forms/share/:shareUrl
// @access  Public
export const getFormByShareUrl = async (req, res) => {
  try {
    const form = await Form.findOne({ shareUrl: req.params.shareUrl })
      .populate('projectId', 'name key');

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create form
// @route   POST /api/projects/:projectId/forms
// @access  Private
export const createForm = async (req, res) => {
  try {
    const { name, description, fields, settings } = req.body;

    const form = await Form.create({
      projectId: req.params.projectId,
      name,
      description,
      fields: fields || [],
      settings: settings || {},
      createdBy: req.user._id,
      lastEditedBy: req.user._id,
    });

    const populatedForm = await Form.findById(form._id)
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    res.status(201).json(populatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private
export const updateForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const updatedForm = await Form.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastEditedBy: req.user._id,
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    res.json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private
export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    await Form.findByIdAndDelete(req.params.id);
    res.json({ message: 'Form removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit form
// @route   POST /api/forms/:id/submit
// @access  Public (if allowAnonymous) or Private
export const submitForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id).populate('projectId');

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    // Check if anonymous submissions are allowed
    if (!form.settings.allowAnonymous && !req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { data, submittedByName, submittedByEmail } = req.body;

    // Create form submission
    const submission = await FormSubmission.create({
      formId: form._id,
      projectId: form.projectId._id,
      submittedBy: req.user?._id,
      submittedByName: submittedByName || req.user?.name,
      submittedByEmail: submittedByEmail || req.user?.email,
      data: data || {},
    });

    // Auto-create issue if enabled
    let issue = null;
    if (form.settings.autoCreateIssue) {
      const projectData = await Project.findById(form.projectId._id);
      const issueKey = await generateIssueKey(projectData.key);

      // Extract title from form data (use first field or form name)
      const titleField = form.fields.find((f) => f.name === 'title') || form.fields[0];
      const issueTitle = data[titleField?.name] || `${form.name} - ${submission.submittedByName || 'Anonymous'}`;

      // Extract description from form data
      const descriptionField = form.fields.find((f) => f.type === 'textarea');
      const issueDescription = descriptionField
        ? data[descriptionField.name]
        : Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');

      issue = await Issue.create({
        projectId: form.projectId._id,
        key: issueKey,
        title: issueTitle,
        description: issueDescription,
        type: form.settings.issueType || 'task',
        status: form.settings.issueStatus || 'todo',
        reporter: req.user?._id || null,
      });

      submission.issueId = issue._id;
      await submission.save();
    }

    // Update form submission count
    form.submissionsCount = (form.submissionsCount || 0) + 1;
    await form.save();

    const populatedSubmission = await FormSubmission.findById(submission._id)
      .populate('issueId', 'key title')
      .populate('formId', 'name');

    res.status(201).json(populatedSubmission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get form submissions
// @route   GET /api/forms/:id/submissions
// @access  Private
export const getFormSubmissions = async (req, res) => {
  try {
    const submissions = await FormSubmission.find({ formId: req.params.id })
      .populate('issueId', 'key title status')
      .populate('submittedBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

