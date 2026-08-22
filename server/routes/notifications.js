const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper to create notifications
const createNotification = (userId, title, message, type = 'general') => {
  try {
    db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
      .run(userId, title, message, type);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// GET /api/notifications - Get user's notifications
router.get('/', authMiddleware, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 30
    `).all(req.user.id);
    
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authMiddleware, (req, res) => {
  try {
    const notifId = parseInt(req.params.id);
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .run(notifId, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Read notification error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/read-all - Mark all user notifications as read
router.put('/read-all', authMiddleware, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
      .run(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Read all notifications error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

module.exports = {
  router,
  createNotification
};
