const express = require('express');
const { protect } = require('../middleware/auth');
const { query, getPool } = require('../config/db');
const { createNotification } = require('../utils/notify');

const router = express.Router();

/**
 * Format notification row for frontend
 */
function formatNotification(row) {
  let parsedData = row.data;
  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData);
    } catch (e) {
      parsedData = null;
    }
  }
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    data: parsedData,
    isRead: !!row.is_read,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * @route   GET /api/notifications
 * @desc    Fetch user's notifications
 */
router.get('/', protect, async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user._id]
    );
    const unreadRows = await query(
      'SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user._id]
    );

    const unreadCount = unreadRows[0]?.unread_count || 0;
    res.json({
      notifications: rows.map(formatNotification),
      unreadCount: Number(unreadCount)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 */
router.put('/read-all', protect, async (req, res) => {
  try {
    await getPool().execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user._id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all read:', error);
    res.status(500).json({ message: 'Error marking all read' });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark single notification as read
 */
router.put('/:id/read', protect, async (req, res) => {
  try {
    await getPool().execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user._id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Delete all notifications for user
 */
router.delete('/clear-all', protect, async (req, res) => {
  try {
    await getPool().execute(
      'DELETE FROM notifications WHERE user_id = ?',
      [req.user._id]
    );
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Error clearing notifications' });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete single notification
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    await getPool().execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user._id]
    );
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

/**
 * @route   POST /api/notifications/:id/respond-invitation
 * @desc    Accept or decline clinic team invitation from inside a notification
 */
router.post('/:id/respond-invitation', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'decline'
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be accept or decline.' });
    }

    const notifs = await query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user._id]
    );
    if (!notifs.length) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const notif = notifs[0];
    let data = notif.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    const doctorId = data.doctorId;
    const doctorName = data.doctorName || 'Doctor';
    const role = data.role || 'staff';

    if (!doctorId) {
      return res.status(400).json({ message: 'Invitation data is missing doctor reference' });
    }

    const io = req.app.get('io');

    if (action === 'accept') {
      // Add or update active membership in doctor_staff table
      await getPool().execute(
        `INSERT INTO doctor_staff (doctor_id, user_id, role, status)
         VALUES (?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE status = 'active', role = VALUES(role)`,
        [doctorId, req.user._id, role]
      );

      // If token exists, mark invitation row accepted
      if (data.token) {
        await getPool().execute(
          "UPDATE invitations SET status = 'accepted' WHERE token = ?",
          [data.token]
        );
      }

      // Update notification record
      data.status = 'accepted';
      const updatedTitle = `🤝 Clinic Team Invitation (Accepted)`;
      const updatedMessage = `You accepted the invitation from Dr. ${doctorName}. You can now manage their clinic appointments from the "Clinic Appointments" tab.`;

      await getPool().execute(
        'UPDATE notifications SET title = ?, message = ?, data = ?, is_read = 1 WHERE id = ?',
        [updatedTitle, updatedMessage, JSON.stringify(data), notif.id]
      );

      // Notify the inviting doctor in real-time
      if (io) {
        await createNotification(io, {
          userId: doctorId,
          type: 'team_accepted',
          title: 'Team Invitation Accepted',
          message: `${req.user.name} (${req.user.phone}) accepted your invitation and is now active on your clinic staff.`,
          data: { staffUserId: req.user._id, staffName: req.user.name, role }
        });
        io.emit(`team_update_${doctorId}`, { staffUserId: req.user._id });
      }

      return res.json({
        message: `Accepted invitation to join Dr. ${doctorName}'s clinic staff`,
        status: 'accepted',
        doctorId,
        doctorName
      });
    } else {
      // Action === 'decline'
      await getPool().execute(
        "UPDATE doctor_staff SET status = 'inactive' WHERE doctor_id = ? AND user_id = ?",
        [doctorId, req.user._id]
      );

      if (data.token) {
        await getPool().execute(
          "UPDATE invitations SET status = 'declined' WHERE token = ?",
          [data.token]
        );
      }

      data.status = 'declined';
      const updatedTitle = `🤝 Clinic Team Invitation (Declined)`;
      const updatedMessage = `You declined the invitation from Dr. ${doctorName}.`;

      await getPool().execute(
        'UPDATE notifications SET title = ?, message = ?, data = ?, is_read = 1 WHERE id = ?',
        [updatedTitle, updatedMessage, JSON.stringify(data), notif.id]
      );

      return res.json({
        message: `Declined invitation from Dr. ${doctorName}`,
        status: 'declined'
      });
    }
  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ message: 'Error processing invitation response' });
  }
});

module.exports = router;
