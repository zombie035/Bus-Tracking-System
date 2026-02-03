import React, { useState } from 'react';

const FloatingMapControls = ({
    mapType,
    onMapTypeChange,
    showRoute,
    onToggleRoute,
    onRecenter
}) => {
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

    const mapTypes = [
        { id: 'normal', icon: 'fa-map', label: 'Default' },
        { id: 'satellite', icon: 'fa-satellite', label: 'Satellite' },
        { id: 'terrain', icon: 'fa-mountain', label: 'Terrain' }
    ];

    return (
        <div className="absolute right-4 top-24 z-[900] flex flex-col gap-3">
            {/* Map Layers Button */}
            <div className="relative">
                <button
                    onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
                    className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 active:bg-gray-50 transition-colors border border-zinc-100"
                >
                    <i className="fas fa-layer-group text-lg"></i>
                </button>

                {/* Expanded Layer Menu */}
                {isLayerMenuOpen && (
                    <div className="absolute right-12 top-0 bg-white rounded-xl shadow-xl p-3 w-48 border border-zinc-100 flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase px-2 mb-1">Map Type</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {mapTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        onMapTypeChange(type.id);
                                        setIsLayerMenuOpen(false);
                                    }}
                                    className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${mapType === type.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50'}`}
                                >
                                    <i className={`fas ${type.icon} text-gray-600`}></i>
                                    <span className="text-[10px] text-gray-600 font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 my-1"></div>

                        <h4 className="text-xs font-bold text-gray-500 uppercase px-2 mb-1">Map Details</h4>
                        <button
                            onClick={onToggleRoute}
                            className={`flex items-center justify-between px-2 py-2 rounded-lg ${showRoute ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <span className="text-sm font-medium">Bus Route</span>
                            {showRoute && <i className="fas fa-check text-blue-600"></i>}
                        </button>
                    </div>
                )}
            </div>

            {/* Recenter Button */}
            <button
                onClick={onRecenter}
                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-blue-600 hover:text-blue-700 active:bg-gray-50 transition-colors border border-zinc-100"
            >
                <i className="fas fa-crosshairs text-lg"></i>
            </button>

            {/* Compass/Tilt (Visual only for now) */}
            <button
                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-50 transition-colors border border-zinc-100 transform -rotate-45"
            >
                <i className="far fa-compass text-lg"></i>
            </button>
        </div>
    );
};

export default FloatingMapControls;
