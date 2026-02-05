import Shortcut from '../models/Shortcut.js';

// @desc    Get all shortcuts for a user
// @route   GET /api/shortcuts
// @access  Private
export const getShortcuts = async (req, res) => {
  try {
    const shortcuts = await Shortcut.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(shortcuts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a shortcut
// @route   POST /api/shortcuts
// @access  Private
export const createShortcut = async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ message: 'Name and URL are required' });
    }

    // Extract emoji from name if present
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const emojiMatch = name.match(emojiRegex);
    const icon = emojiMatch ? emojiMatch[0] : null;

    // Validate URL format
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }

    const shortcut = await Shortcut.create({
      userId: req.user._id,
      name: name.trim(),
      url: validUrl,
      icon,
    });

    res.status(201).json(shortcut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a shortcut
// @route   PUT /api/shortcuts/:id
// @access  Private
export const updateShortcut = async (req, res) => {
  try {
    const shortcut = await Shortcut.findById(req.params.id);

    if (!shortcut) {
      return res.status(404).json({ message: 'Shortcut not found' });
    }

    // Check if user owns the shortcut
    if (shortcut.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, url } = req.body;

    // Extract emoji from name if present
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const emojiMatch = name?.match(emojiRegex);
    const icon = emojiMatch ? emojiMatch[0] : shortcut.icon;

    // Validate URL format
    let validUrl = url?.trim() || shortcut.url;
    if (url && !validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }

    const updatedShortcut = await Shortcut.findByIdAndUpdate(
      req.params.id,
      {
        name: name?.trim() || shortcut.name,
        url: validUrl,
        icon,
      },
      { new: true, runValidators: true }
    );

    res.json(updatedShortcut);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a shortcut
// @route   DELETE /api/shortcuts/:id
// @access  Private
export const deleteShortcut = async (req, res) => {
  try {
    const shortcut = await Shortcut.findById(req.params.id);

    if (!shortcut) {
      return res.status(404).json({ message: 'Shortcut not found' });
    }

    // Check if user owns the shortcut
    if (shortcut.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Shortcut.findByIdAndDelete(req.params.id);

    res.json({ message: 'Shortcut removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete all shortcuts for a user
// @route   DELETE /api/shortcuts
// @access  Private
export const deleteAllShortcuts = async (req, res) => {
  try {
    await Shortcut.deleteMany({ userId: req.user._id });

    res.json({ message: 'All shortcuts removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

