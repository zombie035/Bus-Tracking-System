// client/src/components/Student/ETACountdown.jsx
import React, { useState, useEffect } from 'react';

const ETACountdown = ({ eta, distance, onRefresh }) => {
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        if (!eta || !eta.minutes) {
            setCountdown(null);
            return;
        }

        let minutes = 0;
        const minutesVal = eta.minutes;
        if (typeof minutesVal === 'string') {
            minutes = parseInt(minutesVal.replace(/\D/g, ''));
        } else {
            minutes = minutesVal;
        }

        if (isNaN(minutes)) minutes = 0;
        setCountdown(minutes * 60);

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [eta]);

    const formatTimeFragments = (seconds) => {
        if (seconds === null || seconds === undefined) return { min: '--', sec: '--' };
        if (seconds <= 0) return { min: '00', sec: '00' };

        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return {
            min: mins.toString(),
            sec: secs.toString().padStart(2, '0')
        };
    };

    const { min, sec } = formatTimeFragments(countdown);
    const isArriving = countdown !== null && countdown < 180 && countdown > 0;

    return (
        <div className="bg-white border border-zinc-200 p-6 flex flex-col justify-between h-full relative group hover:border-zinc-400 transition-colors duration-300">
            {/* Minimalist Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Arrival Time</h3>
                </div>
                <button
                    onClick={onRefresh}
                    className="text-zinc-300 hover:text-zinc-600 transition-colors"
                >
                    <i className="fas fa-sync-alt"></i>
                </button>
            </div>

            {/* Time Display - Big & Sharp */}
            <div className="mt-4">
                {countdown !== null && countdown <= 0 ? (
                    <div className="text-4xl font-black text-emerald-600 tracking-tighter uppercase">
                        Arriving
                    </div>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">{min}</span>
                        <div className="flex flex-col justify-end pb-1">
                            <span className="text-sm font-bold text-zinc-400 uppercase leading-none">Min</span>
                        </div>
                        <span className="text-3xl font-light text-zinc-300 mx-2">/</span>
                        <span className="text-3xl font-bold text-zinc-500 tracking-tighter leading-none">{sec}</span>
                        <span className="text-xs font-bold text-zinc-300 uppercase self-end pb-1">Sec</span>
                    </div>
                )}
            </div>

            {/* Status Bar - Sharp */}
            <div className="mt-6">
                {distance && (
                    <div className="flex items-center gap-2 text-zinc-600 font-medium text-sm">
                        <span className="w-1.5 h-1.5 bg-zinc-900 inline-block"></span>
                        {distance} away
                    </div>
                )}
                <div className="w-full h-1 bg-zinc-100 mt-3 relative overflow-hidden">
                    {isArriving && (
                        <div className="absolute inset-0 bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ETACountdown;
