// server/utils/etaService.js
// ETA calculation and route management utilities

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA in minutes based on distance and average speed
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} averageSpeedKmh - Average speed in km/h (default 30)
 * @returns {number} ETA in minutes
 */
function calculateETAMinutes(distanceKm, averageSpeedKmh = 30) {
    if (distanceKm <= 0) return 0;
    if (averageSpeedKmh <= 0) averageSpeedKmh = 30; // Default to 30 km/h if invalid

    const hours = distanceKm / averageSpeedKmh;
    const minutes = Math.round(hours * 60);

    return minutes;
}

/**
 * Calculate ETA from bus location to stop
 * @param {Object} busLocation - {latitude, longitude}
 * @param {Object} stopLocation - {latitude, longitude}
 * @param {number} averageSpeed - Average speed in km/h
 * @returns {Object} {distance, eta, etaText}
 */
function calculateETA(busLocation, stopLocation, averageSpeed = 30) {
    const distance = calculateDistance(
        busLocation.latitude,
        busLocation.longitude,
        stopLocation.latitude,
        stopLocation.longitude
    );

    const etaMinutes = calculateETAMinutes(distance, averageSpeed);

    return {
        distance: parseFloat(distance.toFixed(2)),
        eta: etaMinutes,
        etaText: formatETAText(etaMinutes)
    };
}

/**
 * Format ETA into human-readable text
 * @param {number} minutes - ETA in minutes
 * @returns {string} Formatted ETA text
 */
function formatETAText(minutes) {
    if (minutes <= 0) return 'Arriving now';
    if (minutes < 60) return `${minutes} mins`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr${hours > 1 ? 's' : ''} ${mins} mins`;
}

/**
 * Recalculate ETAs for all stops on a route after a delay
 * @param {Object} busLocation - Current bus location
 * @param {Array} stops - Array of stop objects with coordinates
 * @param {number} delayMinutes - Delay in minutes to add
 * @param {number} averageSpeed - Average speed in km/h
 * @returns {Array} Stops with updated ETAs
 */
function recalculateRouteETAs(busLocation, stops, delayMinutes = 0, averageSpeed = 30) {
    const updatedStops = stops.map((stop, index) => {
        const eta = calculateETA(busLocation, stop, averageSpeed);

        return {
            ...stop,
            distance: eta.distance,
            eta: eta.eta + delayMinutes,
            etaText: formatETAText(eta.eta + delayMinutes),
            delayed: delayMinutes > 0,
            delayMinutes: delayMinutes
        };
    });

    return updatedStops;
}

/**
 * Find the next stop based on bus location
 * @param {Object} busLocation - {latitude, longitude}
 * @param {Array} stops - Array of stops with coordinates
 * @param {number} currentStopIndex - Current stop index in route
 * @returns {Object} Next stop with ETA
 */
function getNextStop(busLocation, stops, currentStopIndex = 0) {
    if (!stops || stops.length === 0) return null;

    // If we haven't passed all stops
    if (currentStopIndex < stops.length) {
        const nextStop = stops[currentStopIndex];
        const eta = calculateETA(busLocation, nextStop);

        return {
            ...nextStop,
            stopIndex: currentStopIndex,
            ...eta
        };
    }

    return null; // All stops completed
}

/**
 * Calculate total route distance
 * @param {Array} stops - Array of stops with coordinates
 * @returns {number} Total distance in kilometers
 */
function calculateTotalRouteDistance(stops) {
    if (!stops || stops.length < 2) return 0;

    let totalDistance = 0;

    for (let i = 0; i < stops.length - 1; i++) {
        const distance = calculateDistance(
            stops[i].latitude,
            stops[i].longitude,
            stops[i + 1].latitude,
            stops[i + 1].longitude
        );
        totalDistance += distance;
    }

    return parseFloat(totalDistance.toFixed(2));
}

/**
 * Determine if bus is near a stop (within threshold)
 * @param {Object} busLocation - {latitude, longitude}
 * @param {Object} stopLocation - {latitude, longitude}
 * @param {number} thresholdMeters - Threshold in meters (default 100m)
 * @returns {boolean} True if bus is near stop
 */
function isNearStop(busLocation, stopLocation, thresholdMeters = 100) {
    const distanceKm = calculateDistance(
        busLocation.latitude,
        busLocation.longitude,
        stopLocation.latitude,
        stopLocation.longitude
    );

    const distanceMeters = distanceKm * 1000;
    return distanceMeters <= thresholdMeters;
}

/**
 * Update current stop index based on bus location
 * @param {Object} busLocation - {latitude, longitude}
 * @param {Array} stops - Array of stops
 * @param {number} currentIndex - Current stop index
 * @returns {number} Updated stop index
 */
function updateCurrentStopIndex(busLocation, stops, currentIndex) {
    if (!stops || stops.length === 0) return 0;
    if (currentIndex >= stops.length) return currentIndex;

    // Check if bus has reached the current stop
    const currentStop = stops[currentIndex];
    if (isNearStop(busLocation, currentStop, 150)) { // 150m threshold
        // Move to next stop if available
        return Math.min(currentIndex + 1, stops.length);
    }

    return currentIndex;
}

/**
 * Calculate estimated arrival time at destination
 * @param {Object} busLocation - Current bus location
 * @param {Object} destination - Destination coordinates
 * @param {number} currentSpeed - Current speed in km/h
 * @param {number} delayMinutes - Current delay in minutes
 * @returns {Object} Arrival information
 */
function calculateArrivalTime(busLocation, destination, currentSpeed = 30, delayMinutes = 0) {
    const eta = calculateETA(busLocation, destination, currentSpeed);
    const totalMinutes = eta.eta + delayMinutes;

    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + totalMinutes);

    return {
        eta: totalMinutes,
        etaText: formatETAText(totalMinutes),
        arrivalTime: arrivalTime.toISOString(),
        distance: eta.distance,
        delayed: delayMinutes > 0,
        delayMinutes: delayMinutes
    };
}

module.exports = {
    calculateDistance,
    calculateETA,
    calculateETAMinutes,
    formatETAText,
    recalculateRouteETAs,
    getNextStop,
    calculateTotalRouteDistance,
    isNearStop,
    updateCurrentStopIndex,
    calculateArrivalTime
};
