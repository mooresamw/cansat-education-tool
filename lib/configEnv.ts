/*
Return the API URL base from configured ENV
 */
function getAPIURLBase(): string {
    return process.env.NEXT_PUBLIC_API_URL_BASE || "/backend";
}

export const apiUrlBase = getAPIURLBase();
