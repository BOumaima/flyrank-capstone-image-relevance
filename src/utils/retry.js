import { getRetryDelay } from "./getRetryDelay.js";

export async function retry(
    operation,
    {
        maxAttempts = 3,
        baseDelayMs = 1000,
        shouldRetry = () => true,
    } = {}
) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (
                attempt === maxAttempts ||
                !shouldRetry(error)
            ) {
                break;
            }

            const fallbackDelay =
                baseDelayMs * 2 ** (attempt - 1);

            const delay = getRetryDelay(
                error,
                fallbackDelay
            );

            console.log(
                `Attempt ${attempt} failed. Retrying in ${delay}ms...`
            );

            await new Promise((resolve) => {
                setTimeout(resolve, delay);
            });
        }
    }

    throw lastError;
}