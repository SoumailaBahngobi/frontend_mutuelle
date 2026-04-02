const appConfig = {
    api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8081',
        timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
    },
    keycloak: {
        url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8088',
        realm: process.env.REACT_APP_KEYCLOAK_REALM || 'mutuelle-realm',
        clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'mutuelle-client',
    },
    upload: {
        maxSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 5242880,
        allowedTypes: (process.env.REACT_APP_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg,application/pdf').split(','),
    },
    routes: {
        public: ['/', '/login', '/register', '/forgot-password', '/reset-password'],
        dashboard: '/dashboard',
        login: '/login',
    }
};

export default appConfig;