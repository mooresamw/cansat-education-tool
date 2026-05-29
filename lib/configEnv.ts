/*
Return the API URL base from configured ENV
 */
function getAPIURLBase(): string {
    //return process.env.NEXT_PUBLIC_API_URL_BASE || "/backend";
    const isDev = process.env.NEXT_PUBLIC_ENV === 'development';
    return isDev ? 'http://localhost:8080' : '/backend';

}

export const apiUrlBase = getAPIURLBase();

// Cloud Run service that compiles and runs submitted code. Called directly from
// the browser with the user's Firebase ID token, so it must be a full URL.
export const codeExecUrl =
    process.env.NEXT_PUBLIC_CODE_EXEC_URL ||
    'https://cpp-runner-293736072539.us-central1.run.app';
