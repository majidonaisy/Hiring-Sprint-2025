# Testing Guide

## Running Tests

The backend includes automated tests using Jest and Supertest.

### Install Dependencies

```bash
cd backend
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage

After running `npm run test:coverage`, view the coverage report in `backend/coverage/lcov-report/index.html`.

## Test Structure

```
backend/src/__tests__/
├── health.test.ts         # Health check endpoint tests
└── assessments.test.ts    # Assessment model validation tests
```

## What's Tested

### Health Check Endpoints ✅

- `/health` endpoint returns 200 status
- Response includes status, timestamp, and uptime
- Timestamp is in valid ISO format
- Uptime is a positive number

### Assessment Model Validation ✅

- Required fields validation (vehicleId, vehicleName)
- Valid vehicle angles (front, rear, driver_side, passenger_side, roof)
- Valid assessment phases (pickup, return)
- Damage severity levels (minor, moderate, severe)
- Cost calculation (handles zero and positive values)

## Adding New Tests

1. Create a new file in `backend/src/__tests__/` with `.test.ts` extension
2. Import testing utilities:

   ```typescript
   import { describe, it, expect } from '@jest/globals';
   import request from 'supertest';
   ```

3. Write your tests following the existing patterns
4. Run `npm test` to verify

## CI/CD Integration

Tests automatically run on:

- Pull requests
- Push to main branch
- Manual trigger via GitHub Actions

Failed tests will block deployment.
