import 'whatwg-fetch';

var DFetch = {
    headers: {
        "Content-Type": "application/json",
        jsonerror: true
    },
    credentials: "same-origin",
    send: function (method, url, data) {
        var fetchOptions = {
            method: method,
            headers: this.headers,
            credentials: this.credentials
        };
        if (data) {
            fetchOptions.body = JSON.stringify(data);
        }
        return fetch(url, fetchOptions)
            .then(function (res) {
                    console.log(res);
                    if (res.status == 204) {
                        return {};
                    }
                    return res.json().then(function (json) {
                        if (res.ok) {
                            return json;
                        } else {
                            throw json;
                        }
                    });
                }, function (error) {
                    console.log(error);
                    return error;
                }
            );
    },
    get: function (url) {
        return this.send('GET', url);
    },
    post: function (url, data) {
        return this.send('POST', url, data);
    },
    put: function (url, data) {
        return this.send('PUT', url, data);
    },
    delete: function (url, data) {
        return this.send('DELETE', url, data);
    }
};

export default DFetch;