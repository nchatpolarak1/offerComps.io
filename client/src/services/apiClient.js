// wrapper around fetch for calling the API

const BASE_URL = '/api';

let authToken = null;

function setToken(token) {
    authToken = token;
}

function buildHeaders(hasBody) {
    const headers = {};

    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }
    if (authToken !== null) {
        headers['Authorization'] = 'Bearer ' + authToken;
    }

    return headers;
}

async function request(method, path, body) {
    const options = {
        method: method,
        headers: buildHeaders(body !== undefined)
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(BASE_URL + path, options);
    const text = await response.text();

    let data = null;
    if (text !== '') {
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error('The server sent a response the app could not read.');
        }
    }

    // the API reports every problem as { error: "message" }
    if (!response.ok) {
        let message = 'Something went wrong. Please try again.';
        if (data !== null && data.error) {
            message = data.error;
        }
        throw new Error(message);
    }

    return data;
}

function get(path) {
    return request('GET', path, undefined);
}

function post(path, body) {
    return request('POST', path, body);
}

function put(path, body) {
    return request('PUT', path, body);
}

function del(path) {
    return request('DELETE', path, undefined);
}

export default {
    setToken: setToken,
    get: get,
    post: post,
    put: put,
    del: del
};
