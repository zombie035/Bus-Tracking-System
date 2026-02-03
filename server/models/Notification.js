// server/models/Notification.js
const { pool } = require('../config/db');

class Notification {
    // Create new notification
    static async create(notificationData) {
        try {
            const {
                recipientType,
                recipientId = null,
                senderId = null,
                title,
                message,
                notificationType = 'info',
                expiresAt = null
            } = notificationData;

            const query = `
        INSERT INTO notifications (
          recipient_type, recipient_id, sender_id, title, message, 
          notification_type, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          id,
          recipient_type as "recipientType",
          recipient_id as "recipientId",
          sender_id as "senderId",
          title,
          message,
          notification_type as "notificationType",
          is_read as "isRead",
          created_at as "createdAt",
          expires_at as "expiresAt"
      `;

            const values = [
                recipientType,
                recipientId,
                senderId,
                title,
                message,
                notificationType,
                expiresAt
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Find notifications by recipient
    static async findByRecipient(recipientType, recipientId = null, limit = 50) {
        try {
            let query;
            let values;

            if (recipientId) {
                // Specific user or broadcast to that user type
                query = `
          SELECT 
            id,
            recipient_type as "recipientType",
            recipient_id as "recipientId",
            sender_id as "senderId",
            title,
            message,
            notification_type as "notificationType",
            is_read as "isRead",
            created_at as "createdAt",
            expires_at as "expiresAt"
          FROM notifications
          WHERE recipient_type = $1 
            AND (recipient_id = $2 OR recipient_id IS NULL)
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY created_at DESC
          LIMIT $3
        `;
                values = [recipientType, recipientId, limit];
            } else {
                // Broadcast to all of that type
                query = `
          SELECT 
            id,
            recipient_type as "recipientType",
            recipient_id as "recipientId",
            sender_id as "senderId",
            title,
            message,
            notification_type as "notificationType",
            is_read as "isRead",
            created_at as "createdAt",
            expires_at as "expiresAt"
          FROM notifications
          WHERE recipient_type = $1 
            AND recipient_id IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY created_at DESC
          LIMIT $2
        `;
                values = [recipientType, limit];
            }

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error finding notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    static async markAsRead(notificationId) {
        try {
            const query = `
        UPDATE notifications 
        SET is_read = TRUE
        WHERE id = $1
        RETURNING 
          id,
          is_read as "isRead"
      `;

            const result = await pool.query(query, [notificationId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Mark all notifications as read for a user
    static async markAllAsRead(recipientType, recipientId) {
        try {
            const query = `
        UPDATE notifications 
        SET is_read = TRUE
        WHERE recipient_type = $1 AND (recipient_id = $2 OR recipient_id IS NULL)
        RETURNING COUNT(*) as "updatedCount"
      `;

            const result = await pool.query(query, [recipientType, recipientId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    // Get unread count
    static async getUnreadCount(recipientType, recipientId) {
        try {
            const query = `
        SELECT COUNT(*) as "unreadCount"
        FROM notifications
        WHERE recipient_type = $1 
          AND (recipient_id = $2 OR recipient_id IS NULL)
          AND is_read = FALSE
          AND (expires_at IS NULL OR expires_at > NOW())
      `;

            const result = await pool.query(query, [recipientType, recipientId]);
            return parseInt(result.rows[0].unreadCount);
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    // Delete expired notifications
    static async deleteExpired() {
        try {
            const query = `
        DELETE FROM notifications
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING COUNT(*) as "deletedCount"
      `;

            const result = await pool.query(query);
            return parseInt(result.rows[0]?.deletedCount || 0);
        } catch (error) {
            console.error('Error deleting expired notifications:', error);
            throw error;
        }
    }

    // Delete notification by ID
    static async deleteById(notificationId) {
        try {
            const query = `
        DELETE FROM notifications
        WHERE id = $1
        RETURNING id
      `;

            const result = await pool.query(query, [notificationId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
}

module.exports = Notification;
