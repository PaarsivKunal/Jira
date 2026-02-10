/**
 * Environment variable validation
 */
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease check your .env file.');
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ CRITICAL: JWT_SECRET must be at least 32 characters long in production.');
      console.error('   Generate a secure secret: openssl rand -base64 32');
      process.exit(1);
    } else {
      console.warn('⚠️  Warning: JWT_SECRET should be at least 32 characters long for security.');
      console.warn('   Generate a secure secret: openssl rand -base64 32');
    }
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(process.env.NODE_ENV)) {
    console.warn(`⚠️  Warning: NODE_ENV should be one of: ${validEnvs.join(', ')}`);
  }

  // Validate FRONTEND_URL format (if provided)
  if (process.env.FRONTEND_URL) {
    try {
      new URL(process.env.FRONTEND_URL);
    } catch (error) {
      console.warn('⚠️  Warning: FRONTEND_URL appears to be invalid. Should be a valid URL.');
    }
  }

  // Validate EMAIL_PORT (if provided)
  if (process.env.EMAIL_PORT) {
    const port = parseInt(process.env.EMAIL_PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.warn('⚠️  Warning: EMAIL_PORT should be a number between 1 and 65535.');
    }
  }

  // Validate MAX_FILE_SIZE (if provided)
  if (process.env.MAX_FILE_SIZE) {
    const size = parseInt(process.env.MAX_FILE_SIZE);
    if (isNaN(size) || size < 0) {
      console.warn('⚠️  Warning: MAX_FILE_SIZE should be a positive number (bytes).');
    }
  }

  // Validate JWT_EXPIRE format (basic check)
  if (process.env.JWT_EXPIRE) {
    const expirePattern = /^\d+[smhd]$/;
    if (!expirePattern.test(process.env.JWT_EXPIRE)) {
      console.warn('⚠️  Warning: JWT_EXPIRE format should be like: 7d, 24h, 60m, 3600s');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Environment variables validated');
  }
};

export default validateEnv;

