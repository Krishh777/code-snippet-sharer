const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const SnippetSchema = new mongoose.Schema({
  snippetId: {
    type: String,
    default: () => uuidv4().slice(0, 8),
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'javascript',
    enum: ['javascript', 'python', 'java', 'cpp', 'sql', 'html', 'css', 'jsx', 'typescript']
  },
  description: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Snippet', SnippetSchema);
