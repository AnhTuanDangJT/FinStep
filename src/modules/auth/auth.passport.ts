import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../config/env';
import { findOrCreateGoogleUser, GoogleProfile } from './auth.oauth';
import { logger } from '../../utils/logger';

/**
 * Check if Google OAuth is configured
 */
export const isGoogleOAuthConfigured = (): boolean => {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
};

/**
 * Configure Google OAuth Strategy
 * Only initialize if Google OAuth credentials are provided
 */
export const configureGoogleStrategy = (): void => {
  if (!isGoogleOAuthConfigured()) {
    if (env.NODE_ENV !== 'production') {
      console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
      console.log('   Google OAuth routes will not work until configured\n');
    }
    return;
  }

  // Explicitly register the strategy with the name 'google'
  // Non-null assertion: isGoogleOAuthConfigured() guarantees these are defined
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback',
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          // Find or create user
          const user = await findOrCreateGoogleUser(profile);
          return done(null, user);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error ?? 'Unknown Google OAuth error'));
          logger.error('Google OAuth callback error', err);
          return done(err, undefined);
        }
      }
    )
  );

  // Serialize user for session (we don't use sessions, but passport requires this)
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const { User } = await import('./auth.model');
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  if (env.NODE_ENV !== 'production') {
    console.log('✅ Google OAuth strategy configured');
  }
};
