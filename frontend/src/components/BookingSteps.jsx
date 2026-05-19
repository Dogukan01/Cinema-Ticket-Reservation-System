import React from 'react';

export default function BookingSteps({ currentStep, onStepClick }) {
    const steps = [
        { id: 1, label: 'Seans Seç' },
        { id: 2, label: 'Bilet Tipi' },
        { id: 3, label: 'Koltuk Seçimi' },
        { id: 4, label: 'Ödeme' }
    ];

    const handleClick = (step) => {
        // Sadece tamamlanan adımlara (geçmişe) geri gidilebilir
        if (step.id < currentStep && onStepClick) {
            onStepClick(step.id);
        }
    };

    return (
        <div style={{
            width: '100%',
            overflowX: 'auto',
            margin: '10px auto 40px auto',
            padding: '10px 0',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
        }}>
            {/* CSS standard scroll hide for Chrome/Safari */}
            <style>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            
            {/* Center flex child container that handles overflow safely */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                width: 'max-content',
                minWidth: '100%',
                margin: '0 auto',
                padding: '0 20px',
                boxSizing: 'border-box',
            }}>
                {steps.map((s, idx) => {
                    const isActive    = s.id === currentStep;
                    const isCompleted = s.id < currentStep;
                    const isClickable = isCompleted && onStepClick;

                    return (
                        <div
                            key={s.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexShrink: 0,   // Küçülmeyi engelle
                                cursor: isClickable ? 'pointer' : 'default',
                                opacity: (!isActive && !isCompleted) ? 0.45 : 1,
                                transition: 'opacity 0.2s ease',
                            }}
                            onClick={() => handleClick(s)}
                            title={isClickable ? `${s.label} adımına dön` : undefined}
                        >
                            {/* Numara balonu */}
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '0.95rem',
                                border: isActive
                                    ? '2.5px solid var(--accent-color)'
                                    : isCompleted
                                        ? '2.5px solid #22c55e'
                                        : '2.5px solid rgba(255,255,255,0.2)',
                                background: isActive
                                    ? 'var(--accent-color)'
                                    : isCompleted
                                        ? '#22c55e'
                                        : 'transparent',
                                color: (isActive || isCompleted) ? '#000' : 'rgba(255,255,255,0.5)',
                                transition: 'all 0.3s ease',
                                boxShadow: isActive ? '0 0 15px rgba(239,68,68,0.5)' : 'none',
                            }}>
                                {isCompleted ? '✓' : s.id}
                            </div>

                            {/* Etiket */}
                            <span style={{
                                fontWeight: isActive ? '800' : '600',
                                color: isActive
                                    ? 'white'
                                    : isCompleted
                                        ? '#86efac'
                                        : 'rgba(255,255,255,0.4)',
                                fontSize: '1.05rem',
                                whiteSpace: 'nowrap',
                                textDecoration: 'none',
                            }}>
                                {s.label}
                            </span>

                            {/* Bağlantı çizgisi */}
                            {idx < steps.length - 1 && (
                                <div style={{
                                    width: '20px',
                                    height: '2px',
                                    flexShrink: 0,
                                    background: isCompleted ? '#22c55e' : 'rgba(255,255,255,0.15)',
                                    marginLeft: '4px',
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
