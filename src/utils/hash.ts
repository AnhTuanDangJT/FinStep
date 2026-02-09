import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 * @throws Error if either argument is missing or invalid
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  // Defensive checks: ensure both arguments are provided
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required for comparison');
  }
  
  if (!hashedPassword || typeof hashedPassword !== 'string') {
    throw new Error('Hashed password is required for comparison');
  }

  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    // Wrap bcrypt errors with a generic message to avoid exposing internals
    throw new Error('Password comparison failed');
  }
};

