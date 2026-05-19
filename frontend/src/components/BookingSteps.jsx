import React from 'react';

export default function BookingSteps({ currentStep }) {
    const steps = [
        { id: 1, label: 'Seans Seç' },
        { id: 2, label: 'Bilet Tipi' },
        { id: 3, label: 'Koltuk Seçimi' },
        { id: 4, label: 'Ödeme' }
    ];

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '20px', 
            margin: '10px auto 40px auto', 
            padding: '10px 0',
            flexWrap: 'wrap'
        }}>
            {steps.map((s, idx) => {
                const isActive = s.id === currentStep;
                const isCompleted = s.id < currentStep;
                
                return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            border: isActive ? '2px solid var(--accent-color)' : isCompleted ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.2)',
                            background: isActive ? 'var(--accent-color)' : isCompleted ? '#22c55e' : 'transparent',
                            color: isActive || isCompleted ? '#000' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.3s ease',
                            boxShadow: isActive ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
                        }}>
                            {s.id}
                        </div>
                        <span style={{
                            fontWeight: isActive ? '700' : '500',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                            fontSize: '1rem',
                            letterSpacing: '0.5px'
                        }}>
                            {s.label}
                        </span>
                        {idx < steps.length - 1 && (
                            <div style={{
                                width: '20px',
                                height: '1px',
                                background: isCompleted ? '#22c55e' : 'rgba(255,255,255,0.1)',
                                marginLeft: '5px'
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
