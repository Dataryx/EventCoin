import web3 from '../ethereum/web3';

const RATE_STORAGE_KEY = 'eventCoinEthUsdRate';
const RATE_CACHE_MS = 15 * 60 * 1000;
const DEFAULT_ETH_USD_RATE = Number(process.env.NEXT_PUBLIC_ETH_USD_RATE || 0);

const toNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
};

export const getDefaultEthUsdRate = () => (DEFAULT_ETH_USD_RATE > 0 ? DEFAULT_ETH_USD_RATE : null);

export const formatUsdValue = (value) => {
    const numericValue = toNumber(value);
    return numericValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const formatEthFromWei = (valueWei, decimals = 4) => {
    try {
        const valueEth = Number(web3.utils.fromWei(String(valueWei || '0'), 'ether'));
        return `${valueEth.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        })} ETH`;
    } catch (error) {
        return '0 ETH';
    }
};

export const getUsdValueFromWei = (valueWei, ethUsdRate) => {
    const rate = toNumber(ethUsdRate);
    if (!rate) {
        return null;
    }

    try {
        const valueEth = Number(web3.utils.fromWei(String(valueWei || '0'), 'ether'));
        return valueEth * rate;
    } catch (error) {
        return null;
    }
};

export const formatUsdFromWei = (valueWei, ethUsdRate, fallback = 'USD unavailable') => {
    const usdValue = getUsdValueFromWei(valueWei, ethUsdRate);
    return usdValue === null ? fallback : formatUsdValue(usdValue);
};

export const formatEthAndUsdFromWei = (valueWei, ethUsdRate, decimals = 4) => {
    const ethLabel = formatEthFromWei(valueWei, decimals);
    const usdLabel = formatUsdFromWei(valueWei, ethUsdRate, '');
    return usdLabel ? `${ethLabel} (${usdLabel})` : ethLabel;
};

export const multiplyWeiAmount = (valueWei, quantity) => {
    try {
        return (BigInt(String(valueWei || '0')) * BigInt(quantity || 0)).toString();
    } catch (error) {
        return '0';
    }
};

export const convertEthToWei = (valueEth) => {
    const normalized = String(valueEth || '').trim();
    if (!normalized) {
        return '0';
    }

    return web3.utils.toWei(normalized, 'ether');
};

const getCachedEthUsdRate = () => {
    if (typeof window === 'undefined') {
        return getDefaultEthUsdRate();
    }

    try {
        const cached = JSON.parse(window.localStorage.getItem(RATE_STORAGE_KEY) || 'null');
        if (!cached?.rate || !cached?.timestamp) {
            return getDefaultEthUsdRate();
        }

        if ((Date.now() - cached.timestamp) > RATE_CACHE_MS) {
            return getDefaultEthUsdRate();
        }

        return toNumber(cached.rate) || getDefaultEthUsdRate();
    } catch (error) {
        return getDefaultEthUsdRate();
    }
};

export const fetchEthUsdRate = async () => {
    const cachedRate = getCachedEthUsdRate();
    if (cachedRate) {
        return cachedRate;
    }

    if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
        return getDefaultEthUsdRate();
    }

    try {
        const response = await window.fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
        const payload = await response.json();
        const fetchedRate = toNumber(payload?.data?.amount);

        if (!fetchedRate) {
            throw new Error('Missing ETH/USD rate.');
        }

        window.localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify({
            rate: fetchedRate,
            timestamp: Date.now()
        }));

        return fetchedRate;
    } catch (error) {
        return getDefaultEthUsdRate();
    }
};
