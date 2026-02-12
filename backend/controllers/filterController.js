import SavedFilter from '../models/SavedFilter.js';

// @desc    Get all saved filters
// @route   GET /api/filters
// @access  Private
export const getFilters = async (req, res) => {
  try {
    const query = { 
      $or: [
        { createdBy: req.user._id },
        { isShared: true }
      ]
    };
    
    if (req.query.projectId) {
      query.projectId = req.query.projectId;
    }

    const filters = await SavedFilter.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name key')
      .sort({ createdAt: -1 });

    res.json(filters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single filter
// @route   GET /api/filters/:id
// @access  Private
export const getFilter = async (req, res) => {
  try {
    const filter = await SavedFilter.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name key');

    if (!filter) {
      return res.status(404).json({ message: 'Filter not found' });
    }

    // Check access
    if (filter.createdBy._id.toString() !== req.user._id.toString() && !filter.isShared) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(filter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create saved filter
// @route   POST /api/filters
// @access  Private
export const createFilter = async (req, res) => {
  try {
    const { name, projectId, filters, dateRange, filterLogic, isShared } = req.body;

    const savedFilter = await SavedFilter.create({
      name,
      projectId,
      filters: filters || {},
      dateRange,
      filterLogic: filterLogic || 'AND',
      isShared: isShared || false,
      createdBy: req.user._id,
    });

    const populatedFilter = await SavedFilter.findById(savedFilter._id)
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name key');

    res.status(201).json(populatedFilter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update saved filter
// @route   PUT /api/filters/:id
// @access  Private
export const updateFilter = async (req, res) => {
  try {
    const filter = await SavedFilter.findById(req.params.id);

    if (!filter) {
      return res.status(404).json({ message: 'Filter not found' });
    }

    // Check ownership
    if (filter.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can update this filter' });
    }

    const updatedFilter = await SavedFilter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('projectId', 'name key');

    res.json(updatedFilter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete saved filter
// @route   DELETE /api/filters/:id
// @access  Private
export const deleteFilter = async (req, res) => {
  try {
    const filter = await SavedFilter.findById(req.params.id);

    if (!filter) {
      return res.status(404).json({ message: 'Filter not found' });
    }

    // Check ownership
    if (filter.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete this filter' });
    }

    await SavedFilter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Filter removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

