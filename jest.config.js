"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.ts',
    ],
    coverageReporters: ['text', 'text-summary'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    errorOnDeprecated: true,
    randomize: true,
};
exports.default = config;
