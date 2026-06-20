const express = require('express');
const Snippet = require('../models/Snippet');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create snippet
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, code, language, description, isPublic } = req.body;

    if (!title || !code) {
      return res.status(400).json({ message: 'Title and code are required' });
    }

    const snippet = new Snippet({
      userId: req.userId,
      title,
      code,
      language: language || 'javascript',
      description,
      isPublic: isPublic !== false
    });

    await snippet.save();

    res.status(201).json({
      message: 'Snippet created successfully',
      snippet,
      shareLink: `${process.env.FRONTEND_URL}/snippet/${snippet.snippetId}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all public snippets
router.get('/', async (req, res) => {
  try {
    const snippets = await Snippet.find({ isPublic: true })
      .select('snippetId title language description views createdAt userId')
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(snippets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get snippet by ID
router.get('/:snippetId', async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ snippetId: req.params.snippetId })
      .populate('userId', 'username')
      .populate('comments.userId', 'username');

    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    // Increment views
    snippet.views += 1;
    await snippet.save();

    res.json(snippet);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's snippets
router.get('/user/my-snippets', authMiddleware, async (req, res) => {
  try {
    const snippets = await Snippet.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(snippets);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update snippet
router.put('/:snippetId', authMiddleware, async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ snippetId: req.params.snippetId });

    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    if (snippet.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, code, language, description, isPublic } = req.body;
    if (title) snippet.title = title;
    if (code) snippet.code = code;
    if (language) snippet.language = language;
    if (description) snippet.description = description;
    if (isPublic !== undefined) snippet.isPublic = isPublic;
    snippet.updatedAt = Date.now();

    await snippet.save();

    res.json({ message: 'Snippet updated', snippet });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete snippet
router.delete('/:snippetId', authMiddleware, async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ snippetId: req.params.snippetId });

    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    if (snippet.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Snippet.deleteOne({ snippetId: req.params.snippetId });

    res.json({ message: 'Snippet deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:snippetId/comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text required' });
    }

    const snippet = await Snippet.findOne({ snippetId: req.params.snippetId });

    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    snippet.comments.push({
      userId: req.userId,
      username: req.username,
      text
    });

    await snippet.save();

    res.json({ message: 'Comment added', snippet });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get stats
router.get('/stats/overview', async (req, res) => {
  try {
    const totalSnippets = await Snippet.countDocuments();
    const totalUsers = await require('../models/User').countDocuments();
    const totalViews = await Snippet.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      totalSnippets,
      totalUsers,
      totalViews: totalViews[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
