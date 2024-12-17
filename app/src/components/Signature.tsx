import React from 'react';

type SignatureProps = {
    devnet: boolean;
    message: string | undefined;
};

const Signature: React.FC<SignatureProps> = ({ devnet, message }) => {
    return (
        <div style={{
            fontSize: '1rem',
            color: 'green',
            transition: 'opacity 1s ease-in-out',
            zIndex: 1000,
            maxWidth: '100%',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            boxSizing: 'border-box',
        }}>
            <a rel="noreferrer" target="_blank" href={`https://explorer.solana.com/tx/${message}/${devnet ? '?cluster=devnet': ''}`} style={{ color: '#DC1FFF' }}>{message}</a>
        </div>
    );
};

export default Signature;