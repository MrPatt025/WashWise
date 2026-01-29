import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.integration.test.ts'],
        testTimeout: 60000, // 60s for container startup
        hookTimeout: 60000,
        pool: 'forks', // Better isolation for integration tests
        poolOptions: {
            forks: {
                singleFork: true, // Run tests sequentially
            },
        },
    },
});
