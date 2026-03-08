// client/src/components/Driver/StudentPickupList.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const StudentPickupList = () => {
    const [students, setStudents] = useState([]);
    const [studentsByStop, setStudentsByStop] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStop, setSelectedStop] = useState('all');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await busService.getStudentList();
            if (response.success) {
                setStudents(response.students || []);
                setStudentsByStop(response.studentsByStop || {});
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStop = selectedStop === 'all' || student.boardingStop === selectedStop;
        return matchesSearch && matchesStop;
    });

    const stops = ['all', ...Object.keys(studentsByStop)];

    if (loading) {
        return (
            <div className="driver-glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="driver-skeleton" style={{ height: '24px', width: '40%' }}></div>
                    <div className="driver-skeleton" style={{ height: '40px' }}></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="driver-skeleton" style={{ height: '60px' }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div className="driver-glass-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'var(--driver-blue-dim)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <i className="fas fa-users" style={{ color: 'var(--driver-blue)', fontSize: '14px' }}></i>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>Student Pickup List</h3>
                            <p style={{ fontSize: '12px', color: 'var(--driver-text-muted)', margin: '2px 0 0' }}>{students.length} students assigned</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStudents}
                        style={{
                            padding: '6px 12px', borderRadius: '8px',
                            background: 'var(--driver-surface)', border: '1px solid var(--driver-border)',
                            color: 'var(--driver-text-dim)', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                        }}
                    >
                        <i className="fas fa-sync-alt" style={{ marginRight: '6px' }}></i>
                        Refresh
                    </button>
                </div>

                {/* Search & Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                        <i className="fas fa-search" style={{
                            position: 'absolute', left: '14px', top: '13px',
                            color: 'var(--driver-text-muted)', fontSize: '13px'
                        }}></i>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search students..."
                            style={{
                                width: '100%', paddingLeft: '40px', paddingRight: '14px',
                                padding: '10px 14px 10px 40px',
                                background: 'var(--driver-surface)', border: '1px solid var(--driver-border)',
                                borderRadius: 'var(--driver-radius-sm)', color: 'white',
                                fontSize: '14px', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {stops.map(stop => (
                            <button
                                key={stop}
                                onClick={() => setSelectedStop(stop)}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px',
                                    fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap',
                                    cursor: 'pointer', border: 'none',
                                    background: selectedStop === stop ? 'var(--driver-green)' : 'var(--driver-surface)',
                                    color: selectedStop === stop ? 'white' : 'var(--driver-text-dim)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {stop === 'all' ? '📍 All Stops' : stop}
                                {stop !== 'all' && studentsByStop[stop] && (
                                    <span style={{
                                        marginLeft: '6px', padding: '1px 6px',
                                        background: 'rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '10px'
                                    }}>
                                        {studentsByStop[stop].length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }} className="driver-scrollable">
                {filteredStudents.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'var(--driver-surface)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 12px', fontSize: '24px', color: 'var(--driver-text-muted)'
                        }}>
                            <i className="fas fa-user-slash"></i>
                        </div>
                        <p style={{ color: 'var(--driver-text-dim)' }}>No students found</p>
                    </div>
                ) : (
                    filteredStudents.map((student, index) => (
                        <div
                            key={student.id || index}
                            style={{
                                padding: '14px 16px',
                                borderBottom: '1px solid var(--driver-border)',
                                transition: 'background 0.2s ease',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--driver-surface)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--driver-blue), var(--driver-purple))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontWeight: 800, fontSize: '16px', flexShrink: 0
                                }}>
                                    {student.name?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>{student.name}</h4>
                                        <span style={{
                                            padding: '2px 8px', background: 'var(--driver-blue-dim)',
                                            color: 'var(--driver-blue)', borderRadius: '6px',
                                            fontSize: '11px', fontWeight: 600
                                        }}>
                                            {student.studentId}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--driver-text-dim)' }}>
                                            <i className="fas fa-map-marker-alt" style={{ color: 'var(--driver-green)', width: '14px' }}></i>
                                            <span style={{ fontWeight: 600 }}>Pickup:</span>
                                            <span>{student.boardingStop || 'N/A'}</span>
                                            {student.boardingTime && <span style={{ color: 'var(--driver-text-muted)' }}>• {student.boardingTime}</span>}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--driver-text-dim)' }}>
                                            <i className="fas fa-map-marker-alt" style={{ color: 'var(--driver-red)', width: '14px' }}></i>
                                            <span style={{ fontWeight: 600 }}>Drop:</span>
                                            <span>{student.droppingStop || 'N/A'}</span>
                                            {student.droppingTime && <span style={{ color: 'var(--driver-text-muted)' }}>• {student.droppingTime}</span>}
                                        </div>
                                        {student.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                                <i className="fas fa-phone" style={{ color: 'var(--driver-blue)', width: '14px' }}></i>
                                                <a href={`tel:${student.phone}`} style={{ color: 'var(--driver-blue)' }}>
                                                    {student.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentPickupList;
