// client/src/components/Common/MapComponent.jsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const MapComponent = ({
  center = [9.925201, 78.119775],
  zoom = 13,
  markers = [],
  routes = [],
  onMapClick,
  interactive = true,
  className = '',
  onMapReady,
  tileLayer = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routesRef = useRef([]);
  const tileLayerRef = useRef(null);

  // Initialize map (only once)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // Create new map
      const map = L.map(mapRef.current, {
        center,
        zoom,
        zoomControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive
      });

      // Add tile layer
      tileLayerRef.current = L.tileLayer(tileLayer, {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Add click handler
      if (onMapClick) {
        map.on('click', (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = map;

      // Notify parent when map is ready
      if (onMapReady) {
        onMapReady(map);
      }

      // Fix map size after initialization
      setTimeout(() => {
        if (map && mapRef.current) {
          map.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Map initialization error:', error);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('Map cleanup error:', error);
        }
      }
    };
  }, []); // Only run once


  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      if (!markerData.position || !markerData.position.lat || !markerData.position.lng) {
        return;
      }

      let icon;
      if (markerData.iconHtml) {
        icon = L.divIcon({
          html: markerData.iconHtml,
          className: markerData.className || 'custom-marker',
          iconSize: markerData.iconSize || [40, 40],
          iconAnchor: markerData.iconAnchor || [20, 40]
        });
      } else {
        const color = markerData.color || '#3498db';
        const type = markerData.type || 'default';
        let iconContent = markerData.icon || '📍';
        let size = markerData.size || 40;

        // Custom styles based on type
        if (type === 'stop') {
          size = 30; // Smaller for stops
          iconContent = '<div style="background-color: white; border-radius: 50%; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: black; font-weight: bold; font-size: 12px; border: 2px solid ' + color + ';">' + (markerData.label || '') + '</div>';
        }

        if (type === 'stop' && !markerData.iconHtml) {
          icon = L.divIcon({
            html: iconContent,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
          });
        } else {
          const iconHtml = `
              <div style="
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: ${markerData.iconSize || 16}px;
              ">
                ${iconContent}
              </div>
            `;
          icon = L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size]
          });
        }
      }

      const marker = L.marker([
        markerData.position.lat,
        markerData.position.lng
      ], { icon }).addTo(mapInstanceRef.current);

      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      }

      // Add click handler for details
      if (markerData.onClick) {
        marker.on('click', () => markerData.onClick(markerData));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if markers exist
    if (markers.length > 0 && mapInstanceRef.current && interactive) {
      // Optional: Don't always refit bounds to avoid jumping if only updating position
    }
  }, [markers]);

  // Update routes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing routes
    routesRef.current.forEach(route => route.remove());
    routesRef.current = [];

    // Add new routes
    routes.forEach(routeData => {
      if (!routeData.coordinates || routeData.coordinates.length < 2) {
        return;
      }

      const polyline = L.polyline(
        routeData.coordinates.map(coord => [coord.lat, coord.lng]),
        {
          color: routeData.color || '#1a237e', // Darker Blue default
          weight: routeData.weight || 6,
          opacity: routeData.opacity || 0.8,
          dashArray: routeData.dashed ? '10, 15' : undefined, // Dashed line support
          lineCap: 'round',
          lineJoin: 'round'
        }
      ).addTo(mapInstanceRef.current);

      routesRef.current.push(polyline);
    });
  }, [routes]);

  // Update map center when props change
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;

    try {
      // Use panTo for smooth transition instead of setView
      mapInstanceRef.current.setView(center, zoom, {
        animate: true,
        duration: 0.5
      });
    } catch (error) {
      console.warn('Error updating map view:', error);
    }
  }, [center, zoom]);

  // Update tile layer when prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    // Only update if url changed
    if (tileLayerRef.current._url !== tileLayer) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = L.tileLayer(tileLayer, {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }
  }, [tileLayer]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

export default MapComponent;