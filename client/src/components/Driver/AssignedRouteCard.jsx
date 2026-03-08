// client/src/components/Driver/AssignedRouteCard.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const AssignedRouteCard = () => {
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchRoute();
    }, []);

    const fetchRoute = async () => {
        try {
            const response = await busService.getAssignedRoute();
            if (response.success && response.route) {
                setRoute(response.route);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="driver-glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="driver-skeleton" style={{ height: '24px', width: '60%' }}></div>
                    <div className="driver-skeleton" style={{ height: '16px', width: '40%' }}></div>
                    <div className="driver-skeleton" style={{ height: '16px', width: '80%' }}></div>
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="driver-glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'var(--driver-surface-active)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', fontSize: '24px', color: 'var(--driver-text-muted)'
                }}>
                    <i className="fas fa-route"></i>
                </div>
                <p style={{ color: 'var(--driver-text)', fontWeight: 600 }}>No route assigned</p>
                <p style={{ color: 'var(--driver-text-muted)', fontSize: '13px', marginTop: '4px' }}>Contact admin for route assignment</p>
            </div>
        );
    }

    return (
        <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div className="driver-glass-header" style={{ padding: '16px', borderBottom: '1px solid var(--driver-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--driver-primary), #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '18px'
                        }}>
                            <i className="fas fa-map-marked-alt"></i>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--driver-text)', margin: 0 }}>{route.routeName}</h3>
                            <p style={{ fontSize: '13px', color: 'var(--driver-text-muted)', margin: '2px 0 0' }}>Bus: {route.busNumber}</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--driver-primary)' }}>{route.totalStops}</div>
                        <div style={{ fontSize: '10px', color: 'var(--driver-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stops</div>
                    </div>
                </div>

                {/* Route Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    <div className="driver-stat-card" style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-route" style={{ color: 'var(--driver-primary)' }}></i>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '11px', color: 'var(--driver-text-muted)' }}>Distance</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--driver-text)' }}>
                                    {route.totalDistance ? `${route.totalDistance} km` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="driver-stat-card" style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-map-pin" style={{ color: '#8b5cf6' }}></i>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '11px', color: 'var(--driver-text-muted)' }}>Stops</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--driver-text)' }}>{route.totalStops}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stops List */}
            <div style={{ padding: '12px' }}>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="driver-btn driver-btn-ghost"
                    style={{ width: '100%', justifyContent: 'space-between', marginBottom: '8px', padding: '8px 12px' }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-list-ul" style={{ color: 'var(--driver-primary)' }}></i>
                        View All Stops
                    </span>
                    <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`}></i>
                </button>

                {expanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }} className="driver-scrollable">
                        {route.stops?.map((stop, index) => (
                            <div key={stop.id} className="driver-stop-item" style={{
                                display: 'flex', gap: '12px', padding: '8px',
                                background: 'var(--driver-surface-active)', borderRadius: '8px'
                            }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: 'var(--driver-primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '12px', fontWeight: 'bold'
                                }}>{index + 1}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ fontWeight: 600, color: 'var(--driver-text)', margin: 0, fontSize: '14px' }}>{stop.stopName}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                        {stop.pickupTime && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--driver-text-muted)' }}>
                                                <i className="fas fa-clock" style={{ color: 'var(--driver-primary)', width: '14px' }}></i>
                                                Pickup: {stop.pickupTime}
                                            </div>
                                        )}
                                        {stop.dropTime && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--driver-text-muted)' }}>
                                                <i className="fas fa-clock" style={{ color: 'var(--driver-warning)', width: '14px' }}></i>
                                                Drop: {stop.dropTime}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!expanded && route.stops && route.stops.length > 0 && (
                    <div style={{
                        padding: '10px 14px', background: 'var(--driver-primary-dim)',
                        borderRadius: 'var(--driver-radius-sm)', border: '1px solid rgba(59,130,246,0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--driver-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fas fa-info-circle"></i> First Stop:
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--driver-text)' }}>{route.stops[0].stopName}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignedRouteCard;
