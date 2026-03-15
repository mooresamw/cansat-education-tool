/*
Return the API URL base from configured ENV
 */
function getAPIURLBase(): string {
    if(process.env.NEXT_PUBLIC_ENV === 'production') {
        return 'http://localhost:8080';
    }
    else {
        return 'http://localhost:8080';
    }
}

export const apiUrlBase = getAPIURLBase();