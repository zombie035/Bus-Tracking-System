// client/src/components/Student/NextStopCard.jsx
import React from 'react';

const NextStopCard = ({ nextStop }) => {
    if (!nextStop) return null;

    return (
        <div className="bg-white border border-zinc-200 p-6 flex flex-col justify-between h-full group hover:border-zinc-400 transition-colors duration-300">
            <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Next Stop</h4>

                <h3 className="text-xl font-black text-zinc-900 leading-tight mb-3 line-clamp-2">
                    {nextStop.name}
                </h3>

                {nextStop.scheduledTime && (
                    <div className="text-xs font-mono text-zinc-500">
                        SCHED: <span className="text-zinc-900 font-bold">{nextStop.scheduledTime}</span>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100">
                {nextStop.eta !== null && nextStop.eta !== undefined ? (
                    <div className="flex items-end justify-between">
                        <span className="text-xs text-zinc-400 font-bold uppercase pb-1">Arrival</span>
                        <span className="text-2xl font-black text-zinc-900">{nextStop.eta}<span className="text-xs ml-0.5 text-zinc-400 font-medium align-top">MIN</span></span>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 font-semibold uppercase">Status</span>
                        <span className="text-sm font-bold text-zinc-500">PENDING</span>
                    </div>
                )}

                {nextStop.latitude && nextStop.longitude && (
                    <button
                        onClick={() => window.open(`https://www.google.com/maps?q=${nextStop.latitude},${nextStop.longitude}`, '_blank')}
                        className="w-full mt-4 py-3 flex items-center justify-center gap-2 bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors uppercase tracking-widest"
                    >
                        Navigate <i className="fas fa-arrow-right"></i>
                    </button>
                )}
            </div>
        </div>
    );
};

export default NextStopCard;
