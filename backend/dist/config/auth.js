'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const jwtConfig = {
  secret: process.env.JWT_SECRET || '8HqCQ1vGd0sBPsLI80R+nPSs5r04mRLY4HwP7tNY1zE=',
  expiresIn: '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'M2EqkXRdq+0NVmkPYcIaI+Q+r7r0wuA1uJ8eA4ns6jM=',
  refreshExpiresIn: '8h'
};
exports.default = jwtConfig;
