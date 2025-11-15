export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true,
        }],
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
};
