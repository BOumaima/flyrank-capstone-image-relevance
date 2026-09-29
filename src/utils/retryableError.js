export function isRetryableError(error) {
    const status = error?.status ?? error?.error?.code;

    if ([500, 502, 503, 504].includes(status)) {
        return true;
    }

    if (status === 429) {
        const details = error?.details ?? error?.error?.details ?? [];

        const hasQuotaFailure = details.some(
            (detail) =>
                detail?.["@type"] === "type.googleapis.com/google.rpc.QuotaFailure"
        );

        return !hasQuotaFailure;
    }

    return false;
}