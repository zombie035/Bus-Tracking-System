// client/src/components/Driver/NotificationsPanel.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const NotificationsPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await busService.getNotifications();
            if (response.success) {
                setNotifications(response.notifications || []);
                setUnreadCount(response.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await busService.markNotificationRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getTypeStyle = (type) => {
        const styles = {
            warning: { icon: 'fa-exclamation-triangle', color: 'var(--driver-orange)', bg: 'var(--driver-orange-dim)' },
            alert: { icon: 'fa-exclamation-circle', color: 'var(--driver-red)', bg: 'var(--driver-red-dim)' },
            route_change: { icon: 'fa-route', color: 'var(--driver-blue)', bg: 'var(--driver-blue-dim)' },
            info: { icon: 'fa-info-circle', color: 'var(--driver-blue)', bg: 'var(--driver-blue-dim)' }
        };
        return styles[type] || styles.info;
    };

    const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

    if (loading) {
        return (
            <div className="driver-glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="driver-skeleton" style={{ height: '24px', width: '40%' }}></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div className="driver-skeleton" style={{ height: '16px', width: '70%' }}></div>
                            <div className="driver-skeleton" style={{ height: '14px', width: '50%' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div className="driver-glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--driver-purple), var(--driver-blue))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '14px'
                    }}>
                        <i className="fas fa-bell"></i>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--driver-text-muted)', margin: '2px 0 0' }}>{unreadCount} unread</p>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {unreadCount > 0 && (
                        <span style={{
                            padding: '2px 10px', background: 'var(--driver-red)',
                            color: 'white', borderRadius: '12px', fontSize: '12px', fontWeight: 700
                        }}>
                            {unreadCount}
                        </span>
                    )}
                    <button
                        onClick={fetchNotifications}
                        style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--driver-surface)', border: '1px solid var(--driver-border)',
                            color: 'var(--driver-text-dim)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Refresh"
                    >
                        <i className="fas fa-sync-alt" style={{ fontSize: '12px' }}></i>
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }} className="driver-scrollable">
                {notifications.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'var(--driver-surface)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 12px', fontSize: '24px', color: 'var(--driver-text-muted)'
                        }}>
                            <i className="fas fa-inbox"></i>
                        </div>
                        <p style={{ color: 'var(--driver-text-dim)', fontWeight: 600 }}>No notifications</p>
                        <p style={{ color: 'var(--driver-text-muted)', fontSize: '13px', marginTop: '4px' }}>You're all caught up!</p>
                    </div>
                ) : (
                    <>
                        {displayNotifications.map((notif) => {
                            const typeStyle = getTypeStyle(notif.notificationType);
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                                    style={{
                                        padding: '14px 16px', cursor: 'pointer',
                                        borderBottom: '1px solid var(--driver-border)',
                                        background: !notif.isRead ? 'rgba(139,92,246,0.08)' : 'transparent',
                                        borderLeft: !notif.isRead ? '3px solid var(--driver-purple)' : '3px solid transparent',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--driver-surface-hover)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = !notif.isRead ? 'rgba(139,92,246,0.08)' : 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            background: typeStyle.bg, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <i className={`fas ${typeStyle.icon}`} style={{ color: typeStyle.color, fontSize: '14px' }}></i>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {notif.title}
                                                </h4>
                                                {!notif.isRead && (
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--driver-purple)', flexShrink: 0 }}></div>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--driver-text-dim)', margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {notif.message}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '11px', color: 'var(--driver-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i className="fas fa-clock"></i>
                                                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                                                        month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {!notif.isRead && (
                                                    <span style={{
                                                        padding: '1px 8px', background: 'var(--driver-purple-dim)',
                                                        color: 'var(--driver-purple)', borderRadius: '10px',
                                                        fontSize: '10px', fontWeight: 700
                                                    }}>
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {notifications.length > 5 && (
                            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--driver-border)' }}>
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="driver-btn driver-btn-ghost"
                                    style={{ padding: '8px', textTransform: 'none', fontSize: '13px' }}
                                >
                                    <i className={`fas fa-chevron-${showAll ? 'up' : 'down'}`}></i>
                                    {showAll ? 'Show Less' : `Show All (${notifications.length})`}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
