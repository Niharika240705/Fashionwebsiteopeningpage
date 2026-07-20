import express, { Request, Response } from 'express';
import passport from 'passport';
import User from '../models/User.model';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.utils';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  clearAuthCookies,
  ensureAdminRole,
  REFRESH_COOKIE,
  setAuthCookies,
} from '../utils/auth-cookies';
import { isGoogleOAuthConfigured } from '../utils/oauth-config';
import validator from 'validator';

const router = express.Router();

// Lets the frontend know which OAuth providers are actually wired up, so it can
// disable/hide buttons (e.g. Google) instead of sending the user into a dead end.
router.get('/providers', (_req: Request, res: Response) => {
  res.json({
    google: isGoogleOAuthConfigured(),
    apple: false,
  });
});

function publicUser(user: any) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
    role: user.role,
  };
}

// Register with email/password
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      name,
      provider: 'local',
    });

    await user.save();
    await ensureAdminRole(user);

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'User created successfully',
      user: publicUser(user),
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      message:
        process.env.NODE_ENV === 'production'
          ? 'Registration failed'
          : error.message || 'Registration failed',
    });
  }
});

// Login with email/password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await ensureAdminRole(user);

    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: publicUser(user),
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      message:
        process.env.NODE_ENV === 'production'
          ? 'Login failed'
          : error.message || 'Login failed',
    });
  }
});

// Google OAuth routes - Only enable if configured
if (isGoogleOAuthConfigured()) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: undefined }),
    async (req: any, res: Response) => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      try {
        const user = req.user;
        if (!user) {
          return res.redirect(`${frontendUrl}/?auth=error`);
        }

        await ensureAdminRole(user);

        const accessToken = generateAccessToken({
          userId: user._id.toString(),
          email: user.email,
        });
        const refreshToken = generateRefreshToken({
          userId: user._id.toString(),
          email: user.email,
        });

        setAuthCookies(res, accessToken, refreshToken);
        return res.redirect(`${frontendUrl}/?auth=success`);
      } catch (error: any) {
        console.error('Google OAuth error:', error);
        return res.redirect(`${frontendUrl}/?auth=error`);
      }
    }
  );
} else {
  router.get('/google', (_req: Request, res: Response) => {
    res.status(503).json({
      message:
        'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
    });
  });
}

// Apple OAuth stub
router.post('/apple', async (_req: Request, res: Response) => {
  res.status(501).json({
    message: 'Apple Sign In is not available. Use Google or email/password.',
  });
});

// Refresh token (cookie-first, body fallback for legacy clients)
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken =
      req.cookies?.[REFRESH_COOKIE] || (req.body?.refreshToken as string | undefined);

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    await ensureAdminRole(user);

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
    });
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ message: 'Token refreshed', user: publicUser(user) });
  } catch {
    clearAuthCookies(res);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: publicUser(user) });
  } catch (error: any) {
    res.status(500).json({
      message:
        process.env.NODE_ENV === 'production'
          ? 'Failed to get user'
          : error.message || 'Failed to get user',
    });
  }
});

// Logout
router.post('/logout', async (_req: AuthRequest, res: Response) => {
  clearAuthCookies(res);
  res.json({ message: 'Logout successful' });
});

export default router;
