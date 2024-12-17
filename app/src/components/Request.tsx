import React from 'react';

type RequestProps = {
    message: string | undefined;
};

const Request: React.FC<RequestProps> = ({ message }) => {
    return (
        <div style={{
            padding: '0.2rem',
            color: 'white',
            transition: 'opacity 1s ease-in-out',
            opacity: 1,
            zIndex: 1000,
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: '100%',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            boxSizing: 'border-box',
        }}>
            {message || ' '}
        </div>
    );
};

export default Request;