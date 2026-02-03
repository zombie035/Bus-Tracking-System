// server/services/notificationService.js
class NotificationService {
    constructor() {
        this.clients = new Map(); // userId -> WebSocket connection
        console.log('📡 Notification Service initialized');
    }

    // Register a new WebSocket client
    registerClient(userId, ws) {
        this.clients.set(userId, ws);
        console.log(`✅ Client registered: User ${userId} (Total: ${this.clients.size})`);
    }

    // Unregister a WebSocket client
    unregisterClient(userId) {
        this.clients.delete(userId);
        console.log(`❌ Client unregistered: User ${userId} (Total: ${this.clients.size})`);
    }

    // Send notification to a specific user
    pushNotification(userId, notification) {
        const client = this.clients.get(userId);
        if (client && client.readyState === 1) { // WebSocket.OPEN
            try {
                client.send(JSON.stringify({
                    type: 'notification',
                    data: notification
                }));
                console.log(`📨 Notification sent to user ${userId}`);
                return true;
            } catch (error) {
                console.error(`❌ Error sending to user ${userId}:`, error.message);
                return false;
            }
        }
        return false;
    }

    // Broadcast notification to all connected clients
    broadcastToAll(notification) {
        let sentCount = 0;
        this.clients.forEach((ws, userId) => {
            if (this.pushNotification(userId, notification)) {
                sentCount++;
            }
        });
        console.log(`📢 Broadcast sent to ${sentCount}/${this.clients.size} clients`);
        return sentCount;
    }

    // Broadcast to specific role (admin, driver, student)
    broadcastToRole(notification, role) {
        // This would require tracking user roles with connections
        // For now, broadcast to all and let client filter
        return this.broadcastToAll(notification);
    }

    // Smart broadcast based on notification recipient_type
    async broadcastNotification(notification) {
        const { recipient_type, recipient_id } = notification;

        if (recipient_id) {
            // Send to specific user
            this.pushNotification(recipient_id, notification);
        } else if (recipient_type === 'all') {
            // Send to everyone
            this.broadcastToAll(notification);
        } else {
            // Send to specific role (admin, driver, student)
            this.broadcastToRole(notification, recipient_type);
        }
    }

    // Get connected client count
    getConnectedCount() {
        return this.clients.size;
    }

    // Send ping to keep connections alive
    pingClients() {
        this.clients.forEach((ws, userId) => {
            if (ws.readyState === 1) {
                try {
                    ws.ping();
                } catch (error) {
                    console.error(`❌ Ping failed for user ${userId}`);
                    this.unregisterClient(userId);
                }
            } else {
                this.unregisterClient(userId);
            }
        });
    }
}

module.exports = NotificationService;
