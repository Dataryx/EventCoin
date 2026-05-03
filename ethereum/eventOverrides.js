const EVENT_OVERRIDE_PREFIX = 'eventOverride:';

export const readEventOverride = (eventAddress) => {
    if (typeof window === 'undefined' || !eventAddress) {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(`${EVENT_OVERRIDE_PREFIX}${eventAddress}`);
        const parsedValue = rawValue ? JSON.parse(rawValue) : null;
        return parsedValue && typeof parsedValue === 'object' ? parsedValue : null;
    } catch (error) {
        return null;
    }
};

export const writeEventOverride = (eventAddress, override) => {
    if (typeof window === 'undefined' || !eventAddress || !override) {
        return;
    }

    window.localStorage.setItem(`${EVENT_OVERRIDE_PREFIX}${eventAddress}`, JSON.stringify({
        name: override.name || '',
        description: override.description || '',
        eventDate: override.eventDate || '',
        updatedAt: new Date().toISOString()
    }));
};

export const applyEventOverride = (eventData, override) => {
    if (!eventData || !override) {
        return eventData;
    }

    return {
        ...eventData,
        name: override.name || eventData.name,
        description: override.description || eventData.description,
        eventDate: override.eventDate || eventData.eventDate
    };
};

export const applyStoredEventOverride = (eventData) => {
    if (!eventData?.address) {
        return eventData;
    }

    return applyEventOverride(eventData, readEventOverride(eventData.address));
};
