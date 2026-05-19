import React from 'react';

export default function SeatLegend() {
    return (
        <div className="seat-legend">
            <div className="legend-item">
                <div className="legend-box" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)' }}></div>
                <span>Boş</span>
            </div>
            <div className="legend-item">
                <div className="legend-box" style={{ background: '#eab308' }}></div>
                <span>Seçiminiz</span>
            </div>
            <div className="legend-item">
                <div className="legend-box" style={{ background: '#334155' }}></div>
                <span>Dolu / Kilitli</span>
            </div>
        </div>
    );
}
