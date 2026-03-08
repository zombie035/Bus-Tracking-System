import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SwipeableBottomSheet = ({
    busStatus,
    eta,
    distance,
    nextStop,
    stops = [],
    profile,
    onShowFullPath,
    onShowUserPath,
    nearestStopOrder = 0
}) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const controls = useAnimation();

    // Snap points (percentage of screen height from top)
    const SNAP_COLLAPSED = window.innerHeight - 150;
    const SNAP_EXPANDED = 80;

    useEffect(() => {
        controls.start({ y: SNAP_COLLAPSED });
    }, [controls, SNAP_COLLAPSED]);

    const handleDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.y < -threshold || info.velocity.y < -500) {
            controls.start({ y: SNAP_EXPANDED });
            setIsOpen(true);
        } else if (info.offset.y > threshold || info.velocity.y > 500) {
            controls.start({ y: SNAP_COLLAPSED });
            setIsOpen(false);
        } else {
            controls.start({ y: isOpen ? SNAP_EXPANDED : SNAP_COLLAPSED });
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === '--:--') return '--:--';
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    return (
        <motion.div
            drag="y"
            dragConstraints={{ top: SNAP_EXPANDED, bottom: SNAP_COLLAPSED }}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ y: SNAP_COLLAPSED }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 right-0 h-[85vh] bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-[1100] flex flex-col border-t border-gray-100"
        >
            {/* Handle */}
            <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header / Summary */}
            <div className="px-6 pb-6 border-b border-gray-100">
                {/* Student Profile Summary (Small) */}
                {profile && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">
                            {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-black">{profile.name}</p>
                            <p className="text-xs text-gray-500">{profile.studentId || 'ID: --'}</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Next Stop</p>
                        <h2 className="text-2xl font-black text-black leading-none">{nextStop?.name || 'Loading Route...'}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-black text-black">{eta?.minutes || '--'} <span className="text-sm font-medium text-gray-500">min</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-black rounded-full"></span> {distance || '--'} away</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> Arrival: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            {/* Stops List */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Route Stops</h3>

                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
                    {stops.map((stop, index) => {
                        const stopName = stop.stopName || stop.name;
                        const stopOrder = stop.stopOrder || index + 1;

                        // Status Logic
                        const isPassed = stopOrder < nearestStopOrder;
                        const isNext = stopOrder === nearestStopOrder;
                        const isFuture = stopOrder > nearestStopOrder;
                        const isMyStop = profile?.droppingStop === stopName || profile?.boardingStop === stopName;

                        return (
                            <div key={index} className="relative pl-8">
                                {/* Bullet / Icon */}
                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                                    ${isNext ? 'bg-orange-500 w-6 h-6 -left-[13px] border-orange-200' :
                                        isPassed ? 'bg-green-500 w-5 h-5 -left-[11px] border-green-100' :
                                            'bg-gray-200'}`}>
                                    {isPassed && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {isNext && (
                                        <div className="absolute inset-0 rounded-full animate-ping bg-orange-400 opacity-20"></div>
                                    )}
                                </div>

                                <div className={`transition-all duration-300 ${isPassed ? 'opacity-50 blur-[0.5px]' : 'opacity-100'} ${isNext ? 'scale-105 origin-left' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-base font-bold ${isNext ? 'text-orange-600' : isPassed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                            {stopName}
                                        </h4>
                                        {isNext && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Next</span>}
                                    </div>

                                    <div className="flex gap-3 mt-1">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-400 font-bold">Pick Up</span>
                                            <span className={`text-xs font-mono font-medium ${isNext ? 'text-black' : 'text-gray-500'}`}>{formatTime(stop.pickupTime || stop.scheduledTime)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-400 font-bold">Drop</span>
                                            <span className={`text-xs font-mono font-medium ${isNext ? 'text-black' : 'text-gray-500'}`}>{formatTime(stop.dropTime || stop.departureTime)}</span>
                                        </div>
                                        {isMyStop && <div className="flex items-end"><span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full uppercase mb-0.5">My Stop</span></div>}
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
