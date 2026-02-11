/**
 * Application constants
 * Centralizes magic numbers and configuration values
 */

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_SIZE_MB: 10,
};

export const CACHE = {
  DEFAULT_TTL: 300, // 5 minutes in seconds
  PROJECT_TTL: 300,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const PASSWORD = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
};

export const JWT = {
  MIN_SECRET_LENGTH: 32,
  DEFAULT_EXPIRE: '7d',
};

