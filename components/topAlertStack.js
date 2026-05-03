import React from 'react';
import { Message } from 'semantic-ui-react';

const AUTO_DISMISS_MS = 4200;

const FloatingAlert = ({ alert }) => {
    React.useEffect(() => {
        if (!alert?.onDismiss || !alert?.autoDismissMs) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            alert.onDismiss();
        }, alert.autoDismissMs);

        return () => window.clearTimeout(timeoutId);
    }, [alert]);

    const messageProps = {
        error: alert.type === 'error',
        success: alert.type === 'success',
        info: alert.type === 'info',
        warning: alert.type === 'warning'
    };

    return (
        <Message {...messageProps} className={`toast-message ${alert.type || 'info'}`}>
            {alert.header ? <Message.Header>{alert.header}</Message.Header> : null}
            {alert.content ? <p>{alert.content}</p> : null}
        </Message>
    );
};

const TopAlertStack = ({ alerts = [] }) => {
    const visibleAlerts = alerts.filter(Boolean);

    if (!visibleAlerts.length) {
        return null;
    }

    return (
        <>
            <div className="toast-stack">
                {visibleAlerts.map((alert, index) => (
                    <FloatingAlert
                        key={alert.id || `${alert.type || 'info'}-${alert.header || ''}-${index}`}
                        alert={{
                            autoDismissMs: alert.autoDismissMs === 0 ? 0 : (alert.autoDismissMs || AUTO_DISMISS_MS),
                            ...alert
                        }}
                    />
                ))}
            </div>
            <style jsx>{`
                .toast-stack {
                    position: fixed;
                    top: 16px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: min(560px, calc(100vw - 24px));
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 1200;
                    pointer-events: none;
                }
                .toast-stack :global(.toast-message.ui.message) {
                    margin: 0;
                    pointer-events: auto;
                    border-radius: 16px;
                    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);
                    border: 1px solid rgba(148, 163, 184, 0.22);
                    animation: slideDownFade 0.24s ease;
                }
                .toast-stack :global(.toast-message.ui.message .header) {
                    margin-bottom: 6px;
                }
                .toast-stack :global(.toast-message.ui.message p) {
                    margin: 0;
                    line-height: 1.5;
                }
                @keyframes slideDownFade {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
};

export default TopAlertStack;
