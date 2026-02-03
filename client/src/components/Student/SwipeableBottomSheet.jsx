import React, { useState, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SwipeableBottomSheet = ({
    busStatus,
    eta,
    distance,
    nextStop,
    stops,
    profile,
    onShowFullPath,
    onShowUserPath
}) => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const controls = useAnimation();

    // Snap points (percentage of screen height from top)
    const SNAP_COLLAPSED = window.innerHeight - 160; // Just peeking
    const SNAP_EXPANDED = 100; // Almost full screen

    useEffect(() => {
        controls.start({ y: SNAP_COLLAPSED });
    }, [controls, SNAP_COLLAPSED]);

    const handleDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.y < -threshold || info.velocity.y < -500) {
            // Swipe Up
            controls.start({ y: SNAP_EXPANDED });
            setIsOpen(true);
        } else if (info.offset.y > threshold || info.velocity.y > 500) {
            // Swipe Down
            controls.start({ y: SNAP_COLLAPSED });
            setIsOpen(false);
        } else {
            // Snap back
            controls.start({ y: isOpen ? SNAP_EXPANDED : SNAP_COLLAPSED });
        }
    };

    const formatTime = (minutes) => {
        if (!minutes) return '--';
        return `${minutes} min`;
    };

    return (
        <motion.div
            drag="y"
            dragConstraints={{ top: SNAP_EXPANDED, bottom: SNAP_COLLAPSED }}
            dragElastic={0.2}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ y: SNAP_COLLAPSED }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 right-0 h-[calc(100vh-100px)] bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-[1100] flex flex-col"
            style={{ bottom: 0 }} // Anchor visually but move via transformY
        >
            {/* Handle Bar */}
            <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header Content (Always Visible) */}
            <div className="px-5 pb-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{nextStop?.name || 'Loading Route...'}</h2>
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {eta?.minutes ? `${eta.minutes} min` : 'Calculating...'}
                    </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 gap-4">
                    <span><i className="fas fa-ruler-combined mr-1"></i> {distance || '-- km'}</span>
                    <span><i className="fas fa-clock mr-1"></i> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} arrival</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Show Full Path Button */}
                    <button
                        onClick={onShowFullPath}
                        className="flex-shrink-0 bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <i className="fas fa-route"></i> Show Path (Full)
                    </button>

                    {/* Show User-Bus Path Button */}
                    <button
                        onClick={onShowUserPath}
                        className="flex-shrink-0 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full font-semibold shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2 whitespace-nowrap hover:bg-gray-50"
                    >
                        <i className="fas fa-location-arrow"></i> My Path
                    </button>
                </div>

                {/* Quick Actions List (Text Only) */}
                <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 overflow-x-auto pb-2 scrollbar-hide">

                    <button onClick={() => navigate('/student/report-issue')} className="text-xs font-bold text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap uppercase tracking-wide">
                        Report Issue
                    </button>
                    <button onClick={() => navigate('/student/schedule')} className="text-xs font-bold text-gray-900 hover:text-gray-600 transition-colors whitespace-nowrap uppercase tracking-wide">
                        Full Schedule
                    </button>
                </div>
            </div>

            {/* Scrollable Content (Route List) */}
            <div className="flex-1 overflow-y-auto px-5 py-2 bg-white">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 mt-2">Route Stops</h3>

                <div className="space-y-0 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[15px] top-2 bottom-4 w-0.5 bg-gray-200 z-0"></div>

                    {stops.map((stop, index) => {
                        const isNext = nextStop?.name === stop.name;
                        const isStudentStop = profile?.boardingStop === stop.name || profile?.droppingStop === stop.name;

                        // Helper to format time to AM/PM
                        const formatTime = (timeStr) => {
                            if (!timeStr || timeStr === '--:--') return '--:--';
                            const [hours, minutes] = timeStr.split(':');
                            const h = parseInt(hours, 10);
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            const h12 = h % 12 || 12;
                            return `${h12}:${minutes} ${ampm}`;
                        };

                        return (
                            <div key={index} className={`flex gap-4 relative z-10 py-3 group transition-colors duration-300 ${isNext ? 'bg-blue-50/50 -mx-5 px-5' : ''}`}>
                                <div className="flex flex-col items-center pt-1">
                                    <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center text-[10px] font-bold shadow-sm transition-all duration-300 ${isNext ? 'bg-blue-600 border-blue-200 text-white scale-110 shadow-blue-200' :
                                        isStudentStop ? 'bg-amber-400 border-amber-100 text-white' :
                                            'bg-white border-gray-200 text-gray-500'
                                        }`}>
                                        {isNext ? <i className="fas fa-bus animate-pulse"></i> : (index + 1)}
                                    </div>
                                </div>

                                <div className="flex-1 pb-3 border-b border-gray-50 group-last:border-none">
                                    <div className="flex flex-col gap-1">
                                        <p className={`text-sm font-medium ${isNext || isStudentStop ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                                            {stop.name}
                                        </p>

                                        {/* Times Grid */}
                                        <div className="grid grid-cols-2 gap-4 mt-1">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Pick Up</span>
                                                <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded w-fit">
                                                    <i className="fas fa-arrow-down text-emerald-600 text-[10px]"></i>
                                                    <span className="text-xs font-mono font-medium text-emerald-700">{formatTime(stop.scheduledTime)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Drop</span>
                                                <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded w-fit">
                                                    <i className="fas fa-arrow-up text-red-500 text-[10px]"></i>
                                                    <span className="text-xs font-mono font-medium text-red-700">{formatTime(stop.dropTime)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isStudentStop && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-2 w-fit">
                                                YOUR STOP
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default SwipeableBottomSheet;
