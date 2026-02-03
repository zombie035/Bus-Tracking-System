// client/src/components/Student/DistanceIndicator.jsx
import React from 'react';

const DistanceIndicator = ({ distance }) => {
    if (!distance) return null;

    const getDistanceColor = () => {
        const km = distance.kilometers || 0;
        if (km < 0.5) return 'text-green-600';
        if (km < 2) return 'text-yellow-600';
        return 'text-blue-600';
    };

    const getDistanceIcon = () => {
        const km = distance.kilometers || 0;
        if (km < 0.5) return 'fa-walking';
        if (km < 2) return 'fa-running';
        return 'fa-car';
    };

    const getProgressPercentage = () => {
        const km = distance.kilometers || 0;
        const maxDistance = 10; // 10km max for visualization
        return Math.min((km / maxDistance) * 100, 100);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Distance to Bus</span>
                <i className={`fas ${getDistanceIcon()} ${getDistanceColor()}`}></i>
            </div>

            <div className="text-3xl font-bold mb-2 ${getDistanceColor()}">
                {distance.kilometers < 1
                    ? `${distance.meters}m`
                    : `${distance.kilometers} km`}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${distance.kilometers < 0.5 ? 'bg-green-500' :
                            distance.kilometers < 2 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                    style={{ width: `${100 - getProgressPercentage()}%` }}
                ></div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
                {distance.kilometers < 0.5 && 'Very close!'}
                {distance.kilometers >= 0.5 && distance.kilometers < 2 && 'Nearby'}
                {distance.kilometers >= 2 && 'On the way'}
            </p>
        </div>
    );
};

export default DistanceIndicator;
