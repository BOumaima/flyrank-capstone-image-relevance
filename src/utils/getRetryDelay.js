export function getRetryDelay(error, fallbackDelayMs) {
    const retryDelay = error?.error?.details?.find(
        (detail) => detail["@type"]?.includes("RetryInfo")
    )?.retryDelay;

    if (!retryDelay) {
        return fallbackDelayMs;
    }

    const seconds = Number.parseFloat(
        retryDelay.replace("s", "")
    );

    if (Number.isNaN(seconds)) {
        return fallbackDelayMs;
    }

    return seconds * 1000;
}