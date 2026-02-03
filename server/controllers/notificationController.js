// server/controllers/notificationController.js
const { pool } = require('../config/db');

// Get notifications for a specific user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.session.userId;
        const role = req.session.role;
        const { limit = 50, unreadOnly = false } = req.query;

        console.log(`📬 Fetching notifications for user ${userId} (${role})`);

        let query = `
      SELECT 
        id, 
        title, 
        message, 
        notification_type, 
        is_read, 
        created_at,
        sender_id
      FROM notifications
      WHERE (
        recipient_type = 'all' 
        OR (recipient_type = $1 AND (recipient_id IS NULL OR recipient_id = $2))
      )
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

        const params = [role, userId];

        if (unreadOnly === 'true') {
            query += ' AND is_read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT $3';
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        // Get sender names for notifications
        const notifications = await Promise.all(
            result.rows.map(async (notification) => {
                if (notification.sender_id) {
                    const senderResult = await pool.query(
                        'SELECT name FROM users WHERE id = $1',
                        [notification.sender_id]
                    );
                    notification.sender_name = senderResult.rows[0]?.name || 'System';
                } else {
                    notification.sender_name = 'System';
                }
                return notification;
            })
        );

        const unreadCount = notifications.filter(n => !n.is_read).length;

        console.log(`✅ Found ${notifications.length} notifications (${unreadCount} unread)`);

        res.json({
            success: true,
            notifications,
            unreadCount,
            total: notifications.length
        });

    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications: ' + error.message
        });
    }
};

// Create a new notification (admin/driver only)
exports.createNotification = async (req, res) => {
    try {
        const senderId = req.session.userId;
        const { recipientType, recipientId, title, message, notificationType, expiresAt } = req.body;

        console.log(`📨 Creating notification: "${title}" for ${recipientType}`);

        // Validation
        if (!title || !message || !notificationType) {
            return res.status(400).json({
                success: false,
                message: 'Title, message, and notification type are required'
            });
        }

        const query = `
      INSERT INTO notifications (
        recipient_type, recipient_id, sender_id, title, message, notification_type, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

        const result = await pool.query(query, [
            recipientType || 'all',
            recipientId || null,
            senderId,
            title,
            message,
            notificationType,
            expiresAt || null
        ]);

        const notification = result.rows[0];

        console.log(`✅ Notification created with ID: ${notification.id}`);

        // Broadcast via WebSocket (handled by service)
        if (global.notificationService) {
            global.notificationService.broadcastNotification(notification);
        }

        res.status(201).json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('❌ Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating notification: ' + error.message
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        console.log(`✓ Marking notification ${id} as read for user ${userId}`);

        const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = $1 
      AND (recipient_id = $2 OR recipient_id IS NULL)
      RETURNING *
    `;

        const result = await pool.query(query, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            notification: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification: ' + error.message
        });
    }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.session.userId;
        const role = req.session.role;

        console.log(`✓✓ Marking all notifications as read for user ${userId}`);

        const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE is_read = FALSE
      AND (
        recipient_type = 'all' 
        OR (recipient_type = $1 AND (recipient_id IS NULL OR recipient_id = $2))
      )
    `;

        const result = await pool.query(query, [role, userId]);

        res.json({
            success: true,
            message: 'All notifications marked as read',
            count: result.rowCount
        });

    } catch (error) {
        console.error('❌ Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notifications: ' + error.message
        });
    }
};

// Delete/dismiss a notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        console.log(`🗑️ Deleting notification ${id} for user ${userId}`);

        // For personal notifications, actually delete
        // For broadcast, mark as read instead
        const query = `
      DELETE FROM notifications 
      WHERE id = $1 
      AND recipient_id = $2
      RETURNING *
    `;

        const result = await pool.query(query, [id, userId]);

        if (result.rows.length === 0) {
            // If it's a broadcast, just mark as read
            await pool.query(
                'UPDATE notifications SET is_read = TRUE WHERE id = $1',
                [id]
            );
        }

        res.json({
            success: true,
            message: 'Notification dismissed'
        });

    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification: ' + error.message
        });
    }
};

// Broadcast notification (admin only)
exports.broadcastNotification = async (req, res) => {
    try {
        const senderId = req.session.userId;
        const { recipientType, title, message, notificationType, expiresAt } = req.body;

        console.log(`📢 Broadcasting notification: "${title}" to ${recipientType}`);

        // Validation
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const query = `
      INSERT INTO notifications (
        recipient_type, recipient_id, sender_id, title, message, notification_type, expires_at
      ) VALUES ($1, NULL, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const result = await pool.query(query, [
            recipientType || 'all',
            senderId,
            title,
            message,
            notificationType || 'info',
            expiresAt || null
        ]);

        const notification = result.rows[0];

        console.log(`✅ Broadcast notification created with ID: ${notification.id}`);

        // Broadcast via WebSocket
        if (global.notificationService) {
            global.notificationService.broadcastNotification(notification);
        }

        res.status(201).json({
            success: true,
            notification,
            message: 'Notification broadcasted successfully'
        });

    } catch (error) {
        console.error('❌ Error broadcasting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error broadcasting notification: ' + error.message
        });
    }
};

// Get notification history (admin only)
exports.getNotificationHistory = async (req, res) => {
    try {
        const { limit = 100, recipientType } = req.query;

        console.log('📜 Fetching notification history');

        let query = `
      SELECT 
        n.*,
        u.name as sender_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
    `;

        const params = [];

        if (recipientType && recipientType !== 'all') {
            query += ' WHERE n.recipient_type = $1';
            params.push(recipientType);
        }

        query += ' ORDER BY n.created_at DESC LIMIT $' + (params.length + 1);
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        res.json({
            success: true,
            notifications: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('❌ Error fetching history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notification history: ' + error.message
        });
    }
};

// Get notification statistics (admin only)
exports.getNotificationStats = async (req, res) => {
    try {
        console.log('📊 Fetching notification statistics');

        const statsQuery = `
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as unread_count,
        COUNT(DISTINCT recipient_type) as recipient_types,
        notification_type,
        COUNT(*) as type_count
      FROM notifications
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY notification_type
    `;

        const typeStatsQuery = `
      SELECT 
        recipient_type,
        COUNT(*) as count
      FROM notifications
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY recipient_type
    `;

        const [statsResult, typeStatsResult] = await Promise.all([
            pool.query(statsQuery),
            pool.query(typeStatsQuery)
        ]);

        const totalQuery = await pool.query(
            'SELECT COUNT(*) as total FROM notifications WHERE created_at > NOW() - INTERVAL \'30 days\''
        );

        const readQuery = await pool.query(
            'SELECT COUNT(*) as read FROM notifications WHERE is_read = TRUE AND created_at > NOW() - INTERVAL \'30 days\''
        );

        res.json({
            success: true,
            stats: {
                total: parseInt(totalQuery.rows[0].total),
                read: parseInt(readQuery.rows[0].read),
                unread: parseInt(totalQuery.rows[0].total) - parseInt(readQuery.rows[0].read),
                byType: statsResult.rows,
                byRecipientType: typeStatsResult.rows
            }
        });

    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notification statistics: ' + error.message
        });
    }
};
