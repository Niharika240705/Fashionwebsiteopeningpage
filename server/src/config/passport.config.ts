import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { isGoogleOAuthConfigured } from '../utils/oauth-config';

// Google OAuth Strategy - Only initialize if credentials are provided
if (isGoogleOAuthConfigured()) {
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL ||
    `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL,
      },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // Check if user exists
        let user = await User.findOne({ email: profile.emails?.[0]?.value });

        if (user) {
          // Link Google without overwriting local password provider identity
          if (!user.providerId) {
            user.providerId = profile.id;
          }
          if (profile.photos?.[0]?.value && !user.avatar) {
            user.avatar = profile.photos[0].value;
          }
          if (user.provider === 'local') {
            // Keep local as primary; still allow Google login via providerId/email match
          } else {
            user.provider = 'google';
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = new User({
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || profile.name?.givenName || 'User',
          provider: 'google',
          providerId: profile.id,
          avatar: profile.photos?.[0]?.value,
          isVerified: true,
        });

        await user.save();
        return done(null, user);
      } catch (error: any) {
        return done(error, false);
      }
    }
  ));
} else {
  console.log('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable.');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

export default passport;

