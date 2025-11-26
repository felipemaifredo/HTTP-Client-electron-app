import { HttpRequest } from '../stores/db';

export const httpClient = {
    run: async (request: HttpRequest) => {
        // Prepare config for Axios
        const config = {
            method: request.method,
            url: request.url,
            headers: request.headers,
            params: request.params,
            data: request.body,
        };

        return await window.api.runHttpRequest(config);
    },
};
