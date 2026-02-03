// client/src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';

const useNotifications = (bus, location) => {
    const [notifications, setNotifications] = useState([]);
    const [lastNotificationTime, setLastNotificationTime] = useState({});

    const addNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Calculate distance between two points
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // Check proximity and notify
    useEffect(() => {
        if (!bus?.latitude || !bus?.longitude || !location?.latitude || !location?.longitude) {
            return;
        }

        const checkProximity = () => {
            const distance = calculateDistance(
                location.latitude,
                location.longitude,
                bus.latitude,
                bus.longitude
            );

            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000;

            // Notify if bus is within 2km and we haven't notified in the last 30 minutes
            if (distance <= 2 && (!lastNotificationTime.proximity || now - lastNotificationTime.proximity > thirtyMinutes)) {
                const eta = Math.round((distance / 30) * 60); // 30 km/h average speed
                addNotification(
                    `🚌 Bus ${bus.busNumber} is ${distance.toFixed(1)}km away! ETA: ~${eta} minutes`,
                    'warning'
                );
                setLastNotificationTime(prev => ({ ...prev, proximity: now }));
            }

            // Notify if bus is very close (< 500m)
            if (distance <= 0.5 && (!lastNotificationTime.veryClose || now - lastNotificationTime.veryClose > thirtyMinutes)) {
                addNotification(
                    `🔔 Your bus is arriving soon! Get ready!`,
                    'success'
                );
                setLastNotificationTime(prev => ({ ...prev, veryClose: now }));
            }
        };

        // Check every minute
        const interval = setInterval(checkProximity, 60000);
        checkProximity(); // Check immediately

        return () => clearInterval(interval);
    }, [bus, location, calculateDistance, addNotification, lastNotificationTime]);

    // Notify on bus status change
    useEffect(() => {
        if (!bus?.status) return;

        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (bus.status === 'moving' && (!lastNotificationTime.moving || now - lastNotificationTime.moving > fiveMinutes)) {
            addNotification(`🚦 Bus ${bus.busNumber} is now moving`, 'info');
            setLastNotificationTime(prev => ({ ...prev, moving: now }));
        } else if (bus.status === 'stopped' && (!lastNotificationTime.stopped || now - lastNotificationTime.stopped > fiveMinutes)) {
            addNotification(`⏸️ Bus ${bus.busNumber} has stopped`, 'info');
            setLastNotificationTime(prev => ({ ...prev, stopped: now }));
        }
    }, [bus?.status, bus?.busNumber, addNotification, lastNotificationTime]);

    return {
        notifications,
        addNotification,
        removeNotification
    };
};

export default useNotifications;
