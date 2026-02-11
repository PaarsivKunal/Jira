import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { sendErrorResponse } from '../utils/errorResponse.js';

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// @desc    Create organization
// @route   POST /api/organizations
// @access  Private
export const createOrganization = async (req, res) => {
  try {
    const { name, domain } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Organization name is required' });
    }

    const slug = generateSlug(name);

    // Check if slug exists
    const orgExists = await Organization.findOne({ slug });
    if (orgExists) {
      return res.status(400).json({ 
        message: 'Organization name already taken. Please choose a different name.' 
      });
    }

    const organization = await Organization.create({
      name: name.trim(),
      slug,
      domain: domain ? domain.toLowerCase().trim() : null,
      owner: req.user._id,
      members: [req.user._id],
    });

    // Update user's organization
    await User.findByIdAndUpdate(req.user._id, {
      organization: organization._id,
    });

    const populatedOrg = await Organization.findById(organization._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.status(201).json(populatedOrg);
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to create organization', req.id, 
      process.env.NODE_ENV === 'development' ? { error: error.message } : null);
  }
};

// @desc    Get user's organization
// @route   GET /api/organizations/me
// @access  Private
export const getMyOrganization = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('organization');
    
    if (!user.organization) {
      return res.status(404).json({ message: 'No organization found' });
    }

    const organization = await Organization.findById(user.organization._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json(organization);
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to fetch organization', req.id,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null);
  }
};

// @desc    Check if organization exists by domain
// @route   GET /api/organizations/check-domain
// @access  Public
export const checkDomain = async (req, res) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ message: 'Domain is required' });
    }

    const organization = await Organization.findOne({ 
      domain: domain.toLowerCase().trim() 
    }).select('name slug domain');

    if (organization) {
      return res.json({ 
        exists: true, 
        organization: {
          name: organization.name,
          slug: organization.slug,
        }
      });
    }

    res.json({ exists: false });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to check domain', req.id);
  }
};

