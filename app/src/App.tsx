import React from "react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Request, Response, Signature, Alert} from "./components";
import {useApp} from "./hooks"

const App: React.FC = () => {
    const {
        connection,
        inputText,
        setInputText,
        history,
        doInteractionTx,
        isSubmitting,
        isLoading,
        transactionSuccess,
        setTransactionSuccess,
        transactionError,
        setTransactionError,
    } = useApp();

    return (
        <div className="agent-interaction">
            <div className="wallet-buttons" style={{textAlign: 'center'}}>
                <WalletMultiButton/>
            </div>

            <h1> Who are you? </h1>

            <div className="eyes">
                <div className="eye">
                    <div className="pupil"></div>
                </div>
                <div className="eye">
                    <div className="pupil"></div>
                </div>
            </div>

            <div className="interact-agent">
                <input
                    style={{width: '40rem'}}
                    type="text"
                    placeholder=""
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                            await doInteractionTx(inputText);
                        }
                    }}
                />
            </div>

            <div className="agent-history">
                {history?.map(({input, reply, signature}, index) => {
                    const isPending = index === 0 && (isSubmitting || isLoading);
                    return <div style={{width: '40rem'}}>
                        <div className="agent-request">
                            <Request message={input}/>
                        </div>

                        <div className="agent-response">
                            <Response loading={isPending} message={reply}></Response>
                            <Signature devnet={connection.rpcEndpoint.includes('devnet')}
                                       message={signature}></Signature>
                        </div>
                    </div>
                })}
            </div>

            {transactionError &&
                <Alert type="error" message={transactionError} onClose={() => setTransactionError(null)}/>}

            {transactionSuccess &&
                <Alert type="success" message={transactionSuccess} onClose={() => setTransactionSuccess(null)}/>}

            <a href="https://github.com/GabrielePicco/super-smart-contracts" target="_blank" rel="noreferrer">
                <img src={`${process.env.PUBLIC_URL}/github-mark-white.svg`} alt="Github logo" className="github-logo"/>
            </a>
        </div>
    );
};

export default App;
