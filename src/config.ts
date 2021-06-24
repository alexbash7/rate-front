class Config
{
    public apiUrl(path: string, query: any = null): string
    {
        let queryString = '';
        if (query) {
            var sb = [];

            for (var key in query) {
                sb.push('&');
                sb.push(key);
                sb.push('=');

                var rawValue = query[key];

                if (typeof(rawValue) == 'string') {
                    sb.push(rawValue);
                    continue;
                }

                sb.push(encodeURIComponent(JSON.stringify(rawValue)));
            }

            sb.splice(0, 1);
            queryString = sb.join('');
        }

        return process.env.VUE_APP_API_URL + '/' + path + (queryString ? '?' + queryString : '');
    }
}

export default new Config();