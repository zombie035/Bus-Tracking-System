// client/src/components/Student/BusStatusCard.jsx
import React from 'react';

const BusStatusCard = ({ status, tripInfo }) => {
    const formatStatus = (s) => s?.replace('_', ' ').toUpperCase() || 'IDLE';

    return (
        <div className="bg-white border border-zinc-200 p-6 flex flex-col justify-between h-full relative group hover:border-zinc-400 transition-colors duration-300">

            {/* Live Indicator - Sharp */}
            {status?.tripStatus === 'on_route' && (
                <div className="absolute top-0 right-0 p-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">LIVE</span>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Current Status</span>
                <h3 className="mt-1 text-2xl font-black text-zinc-900 tracking-tight leading-none">
                    {formatStatus(status?.tripStatus)}
                </h3>

                {status?.isDelayed && (
                    <div className="mt-3 inline-block bg-amber-50 border-l-2 border-amber-500 px-3 py-1">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                            DELAY +{status.delayMinutes}m
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-px bg-zinc-100 border border-zinc-100">
                <div className="bg-white p-3">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Speed</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-zinc-900">{tripInfo?.speed ? Math.round(tripInfo.speed) : 0}</span>
                        <span className="text-xs font-medium text-zinc-400">km/h</span>
                    </div>
                </div>
                <div className="bg-white p-3">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Engine</p>
                    <span className={`text-base font-bold ${tripInfo?.engineStatus === 'ON' ? 'text-zinc-900' : 'text-zinc-300'}`}>
                        {tripInfo?.engineStatus || 'OFF'}
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-100 text-right">
                <p className="text-[10px] font-medium text-zinc-400">
                    UPDATED <span className="text-zinc-600 ml-1">{status?.lastUpdate ? new Date(status.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW'}</span>
                </p>
            </div>
        </div>
    );
};

export default BusStatusCard;
