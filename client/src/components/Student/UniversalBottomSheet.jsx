import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import RouteSheetContent from './RouteSheetContent';
import NotificationsSheetContent from './NotificationsSheetContent';
import ProfileSheetContent from './ProfileSheetContent';
import SettingsSheetContent from './SettingsSheetContent';
import FeedbackSheetContent from './FeedbackSheetContent';

const UniversalBottomSheet = ({
    sheetType = null, // 'route', 'notifications', 'settings', 'feedback', or null
    onClose,
    onSheetChange,
    // Route props
    stops = [],
    profile,
    nextStop,
    eta,
    distance,
    nearestStopOrder = 0,
    // Notifications props
    notifications = [],
    // Settings props
    mapTheme,
    onMapThemeChange,
    onLogout
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const controls = useAnimation();

    // Snap points
    const SNAP_COLLAPSED = window.innerHeight + 50; // Fully hidden (off-screen)
    const SNAP_PEEK = window.innerHeight - 80; // Just show grab handle
    const SNAP_EXPANDED = window.innerHeight * 0.15; // 85% of screen visible

    useEffect(() => {
        if (sheetType) {
            // Open sheet
            controls.start({ y: SNAP_EXPANDED });
            setIsOpen(true);
        } else {
            // Close sheet
            controls.start({ y: SNAP_COLLAPSED });
            setIsOpen(false);
        }
    }, [sheetType, controls, SNAP_EXPANDED, SNAP_COLLAPSED]);

    const handleDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.y < -threshold || info.velocity.y < -500) {
            // Swipe up - expand
            controls.start({ y: SNAP_EXPANDED });
            setIsOpen(true);
        } else if (info.offset.y > threshold || info.velocity.y > 500) {
            // Swipe down - close
            controls.start({ y: SNAP_COLLAPSED });
            setIsOpen(false);
            if (onClose) onClose();
        } else {
            // Snap back to current state
            controls.start({ y: isOpen ? SNAP_EXPANDED : SNAP_COLLAPSED });
        }
    };

    const handleBackdropClick = () => {
        controls.start({ y: SNAP_COLLAPSED });
        setIsOpen(false);
        if (onClose) onClose();
    };

    // Render content based on sheet type
    const renderContent = () => {
        switch (sheetType) {
            case 'route':
                return (
                    <RouteSheetContent
                        stops={stops}
                        profile={profile}
                        nextStop={nextStop}
                        eta={eta}
                        distance={distance}
                        nearestStopOrder={nearestStopOrder}
                    />
                );
            case 'notifications':
                return <NotificationsSheetContent notifications={notifications} />;
            case 'profile':
                return <ProfileSheetContent profile={profile} onLogout={onLogout} />;
            case 'settings':
                return (
                    <SettingsSheetContent
                        mapTheme={mapTheme}
                        onMapThemeChange={onMapThemeChange}
                        onLogout={onLogout}
                        onChangeSheet={onSheetChange}
                    />
                );
            case 'feedback':
                return <FeedbackSheetContent onClose={() => { if (onClose) onClose(); }} />;
            default:
                return null;
        }
    };

    return (
        <>
            {/* Dimmed Overlay */}
            {isOpen && sheetType && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 z-[1100] backdrop-blur-sm"
                    onClick={handleBackdropClick}
                />
            )}

            {/* Bottom Sheet */}
            <motion.div
                drag="y"
                dragConstraints={{ top: SNAP_EXPANDED, bottom: SNAP_COLLAPSED }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                animate={controls}
                initial={{ y: SNAP_COLLAPSED }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 right-0 h-[90vh] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-[1150] flex flex-col border-t border-gray-100"
                style={{ touchAction: 'none' }}
            >
                {/* Grab Handle */}
                <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0">
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {renderContent()}
                </div>
            </motion.div>
        </>
    );
};

export default UniversalBottomSheet;
