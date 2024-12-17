import React, { useEffect, useState } from 'react';

type ResponseProps = {
    loading: boolean;
    message: string | undefined;
};

const Response: React.FC<ResponseProps> = ({ loading, message }) => {
    const [loadingDots, setLoadingDots] = useState('.');

    // Handle loading animation
    useEffect(() => {
        if (!message) {
            const loadingInterval = setInterval(() => {
                setLoadingDots(prev => prev.length >= 3 ? '.' : prev + '.');
            }, 500);
            return () => clearInterval(loadingInterval);
        }
    }, [message]);

    return (
        <div style={{
            padding: '0.2rem',
            color: 'white',
            transition: 'opacity 1s ease-in-out',
            opacity: 1,
            zIndex: 1000,
            maxWidth: '100%',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            boxSizing: 'border-box',
        }}>
            {message || (loading ? loadingDots : ' ')}
        </div>
    );
};

export default Response;