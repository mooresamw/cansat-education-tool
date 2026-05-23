/*
Return the API URL base from configured ENV
 */
function getAPIURLBase(): string {
    //return process.env.NEXT_PUBLIC_API_URL_BASE || "/backend";
    const isDev = process.env.NEXT_PUBLIC_ENV === 'development';
    return isDev ? 'http://localhost:8080' : '/backend';

}

export const apiUrlBase = getAPIURLBase();
