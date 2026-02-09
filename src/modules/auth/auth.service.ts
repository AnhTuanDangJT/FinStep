import { User, IUser } from './auth.model';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../../utils/jwt';
import { RegisterInput, LoginInput, UpdateProfileInput } from './auth.schema';
import { logger } from '../../utils/logger';
import { touchLastActive } from '../profile/profile.service';

export interface AuthResponse {
  user: {
    id: string;
    publicId?: string;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 * Returns user data and tokens for automatic login
 */
export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  // Normalize email BEFORE any DB operation (defense against case mismatch)
  const email = (input.email || '').toLowerCase().trim();
  if (!email) {
    throw new Error('Email is required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.provider === 'google') {
      logger.authError('Registration failed', 'Email registered with Google OAuth', email);
      throw new Error('Email already registered via Google');
    }
    logger.authError('Registration failed', 'Email already exists', email);
    throw new Error('Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  // Only ONE super admin: dganhtuan.2k5@gmail.com (enforced at backend)
  const isSuperAdmin = email === 'dganhtuan.2k5@gmail.com';
  const roles = isSuperAdmin ? ['USER', 'ADMIN', 'SUPER_ADMIN'] : ['USER'];
  const role = roles.includes('ADMIN') ? 'admin' : 'user';
  const credibilityScore = isSuperAdmin ? 90 : 50; // New user: 50; Admin: ≥90

  const user = await User.create({
    name: input.name?.trim() || '',
    email,
    passwordHash: hashedPassword,
    provider: 'local',
    roles,
    role,
    credibilityScore,
  });

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  logger.auth('Registration successful', user.email, user._id.toString());

  const publicId = (user as IUser & { publicId?: string }).publicId || user._id.toString();
  return {
    user: {
      id: publicId,
      publicId,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Login existing user
 * Returns user data and tokens
 */
export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const email = (input.email || '').toLowerCase().trim();
  if (!email) {
    throw new Error('Invalid email or password');
  }

  // Validate input password before any database operations
  if (!input.password || typeof input.password !== 'string' || input.password.trim().length === 0) {
    logger.authError('Login failed', 'Password is required', email);
    throw new Error('Invalid email or password');
  }

  // Find user with password field included (try passwordHash first, fallback to password for migration)
  const user = await User.findOne({ email }).select('+passwordHash +password');
  
  // Check if user exists
  // Use generic error to prevent email enumeration
  if (!user) {
    logger.authError('Login failed', 'User not found', email);
    throw new Error('Invalid email or password');
  }

  // Check if user is OAuth user (should use OAuth login instead)
  // Use generic error to prevent revealing account details
  if (user.provider === 'google') {
    logger.authError('Login failed', 'User registered with Google OAuth', email);
    throw new Error('Invalid email or password');
  }

  // Handle password migration: check passwordHash first, fallback to password
  const userPassword = (user.passwordHash || user.password) as string | undefined;
  
  // Defensive check: ensure password exists before comparing
  if (!userPassword || typeof userPassword !== 'string') {
    logger.authError('Login failed', 'User password not available', email);
    throw new Error('Invalid email or password');
  }

  // Compare passwords (with defensive checks in comparePassword function)
  let isPasswordValid = false;
  try {
    isPasswordValid = await comparePassword(input.password, userPassword);
  } catch (error) {
    logger.authError('Login failed', 'Password comparison error', email);
    throw new Error('Invalid email or password');
  }
  
  if (!isPasswordValid) {
    logger.authError('Login failed', 'Invalid password', email);
    throw new Error('Invalid email or password');
  }

  // Migrate password to passwordHash if needed
  if (user.password && !user.passwordHash) {
    user.passwordHash = user.password;
    user.password = undefined;
    await user.save();
  }

  // Only ONE super admin: dganhtuan.2k5@gmail.com (enforced at backend)
  let needsSave = false;
  if (user.email === 'dganhtuan.2k5@gmail.com') {
    if (!user.roles) user.roles = ['USER'];
    if (!user.roles.includes('ADMIN')) user.roles.push('ADMIN');
    if (!user.roles.includes('SUPER_ADMIN')) user.roles.push('SUPER_ADMIN');
    const score = (user as any).credibilityScore;
    if (score == null || score < 90) {
      (user as any).credibilityScore = 90;
      needsSave = true;
    }
  }
  if (user.roles && user.roles.includes('ADMIN')) {
    if (user.role !== 'admin') {
      user.role = 'admin';
      needsSave = true;
    }
  } else {
    if (user.role !== 'user') {
      user.role = user.role || 'user';
      needsSave = true;
    }
  }
  if (needsSave) await user.save();

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  logger.auth('Login successful', user.email, user._id.toString());
  await touchLastActive(user._id.toString()).catch(() => {});

  const publicId = (user as IUser & { publicId?: string }).publicId || user._id.toString();
  return {
    user: {
      id: publicId,
      publicId,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Get user by ID
 * Used in /auth/me endpoint
 */
export const getUserById = async (userId: string): Promise<IUser | null> => {
  return User.findById(userId);
};

/**
 * Update user profile (name, linkedInUrl)
 */
export const updateUserProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<IUser | null> => {
  const user = await User.findById(userId);
  if (!user) return null;

  if (input.name !== undefined) user.name = input.name.trim();
  if (input.linkedInUrl !== undefined) user.linkedInUrl = input.linkedInUrl?.trim() || '';

  await user.save();
  return user;
};

