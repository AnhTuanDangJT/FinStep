import { User, IUser } from './auth.model';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { AuthResponse } from './auth.service';

import { Profile } from 'passport-google-oauth20';

/**
 * Google OAuth profile type
 * Using the official passport-google-oauth20 Profile type
 */
export type GoogleProfile = Profile;

/**
 * Find or create user from Google OAuth profile
 * Matches by email, creates if doesn't exist
 */
export const findOrCreateGoogleUser = async (profile: GoogleProfile): Promise<IUser> => {
  const email = profile.emails?.[0]?.value?.toLowerCase().trim();
  
  if (!email) {
    logger.authError('Google OAuth failed', 'No email in Google profile');
    throw new Error('Google account does not have an email address');
  }

  // Try to find existing user by email
  let user = await User.findOne({ email });

  if (user) {
    // User exists - update provider, googleId, and name if needed
    if (user.provider !== 'google') {
      user.provider = 'google';
    }
    if (!user.googleId) {
      user.googleId = profile.id;
    }
    // Update name if missing or if Google profile has better name
    const googleName = profile.displayName || profile.name?.givenName;
    if (googleName && (!user.name || user.name === 'User')) {
      user.name = googleName;
    }
    // Only ONE super admin: dganhtuan.2k5@gmail.com (enforced at backend) - force role = admin on first login
    if (user.email === 'dganhtuan.2k5@gmail.com') {
      if (!user.roles) user.roles = ['USER'];
      if (!user.roles.includes('ADMIN')) user.roles.push('ADMIN');
      if (!user.roles.includes('SUPER_ADMIN')) user.roles.push('SUPER_ADMIN');
      user.role = 'admin';
      if (user.credibilityScore == null || user.credibilityScore < 90) (user as any).credibilityScore = 90;
    }
    await user.save();
    logger.auth('Google OAuth - Existing user found', email, user._id.toString());
    return user;
  }

  // Try to find by googleId (in case email changed)
  user = await User.findOne({ googleId: profile.id });
  if (user) {
    // Update email if changed
    if (user.email !== email) {
      user.email = email;
      await user.save();
    }
    logger.auth('Google OAuth - User found by Google ID', email, user._id.toString());
    return user;
  }

  const name = profile.displayName || profile.name?.givenName || profile.emails?.[0]?.value?.split('@')[0] || 'User';
  const isSuperAdmin = email === 'dganhtuan.2k5@gmail.com';
  const roles = isSuperAdmin ? ['USER', 'ADMIN', 'SUPER_ADMIN'] : ['USER'];
  const role = roles.includes('ADMIN') ? 'admin' : 'user';
  const credibilityScore = isSuperAdmin ? 90 : 50;

  user = await User.create({
    name,
    email,
    provider: 'google',
    googleId: profile.id,
    roles,
    role,
    credibilityScore,
  });

  logger.auth('Google OAuth - New user created', email, user._id.toString());
  return user;
};

/**
 * Generate auth response for Google OAuth user
 * Same format as email/password login
 */
export const generateAuthResponseForGoogleUser = async (user: IUser): Promise<AuthResponse> => {
  const tokenPayload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
};
