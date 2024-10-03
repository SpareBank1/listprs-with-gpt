export default {
    transform: {
        "^.+\\.js$": "babel-jest",  // Use babel-jest to transform ES modules
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'  // Handle imports with .js extensions
    },
    testEnvironment: 'jsdom',
};