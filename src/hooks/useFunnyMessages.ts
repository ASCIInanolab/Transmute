import { useState, useEffect } from 'react';

const MESSAGES = [
    "Dividing by zero (just kidding)...",
    "Convincing the bits to cooperate...",
    "Spinning up the flux capacitor...",
    "Asking AI for permission...",
    "Reticulating splines...",
    "Downloading more RAM...",
    "Calculating the meaning of life...",
    "Brewing virtual coffee...",
];

export function useFunnyMessages(interval = 2000) {
    const [message, setMessage] = useState(MESSAGES[0]);

    useEffect(() => {
        let index = 0;
        const timer = setInterval(() => {
            index = (index + 1) % MESSAGES.length;
            setMessage(MESSAGES[index]);
        }, interval);
        return () => clearInterval(timer);
    }, [interval]);

    return message;
}
