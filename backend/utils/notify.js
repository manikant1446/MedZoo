const { query, getPool } = require('../config/db');

/**
 * Creates a notification in the DB and broadcasts it in real-time via WebSockets
 */
async function createNotification(io, { userId, type = 'general', title, message, data = null }) {
  try {
    const dataStr = data ? JSON.stringify(data) : null;
    const [result] = await getPool().execute(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, dataStr]
    );

    const rows = await query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    let notification = rows[0];
    if (notification) {
      if (notification.data && typeof notification.data === 'string') {
        try {
          notification.data = JSON.parse(notification.data);
        } catch (e) {}
      }
      notification = {
        ...notification,
        _id: notification.id,
        id: notification.id,
        isRead: !!notification.is_read
      };
    }

    // Live emit to client via Socket.io
    if (io) {
      io.emit(`notification_${userId}`, notification);
      io.emit('notification_broadcast', { userId, notification });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

module.exports = { createNotification };
