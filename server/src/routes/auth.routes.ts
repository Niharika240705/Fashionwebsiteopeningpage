import express, { Request, Response } from 'express';
import passport from 'passport';
import User from '../models/User.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import validator from 'validator';

const router = express.Router();

// Register with email/password
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      name,
      provider: 'local',
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// Login with email/password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    if (!user.password || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

// Google OAuth routes - Only enable if configured
if (process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here' &&
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-here') {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    async (req: any, res: Response) => {
    try {
      const user = req.user;
      const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
      const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

      // Redirect to frontend with tokens
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }
  );
} else {
  router.get('/google', (req: Request, res: Response) => {
    res.status(503).json({ message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' });
  });
}

// Apple OAuth routes
router.post('/apple', async (req: Request, res: Response) => {
  try {
    const { idToken, name } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Apple ID token is required' });
    }

    // In production, verify the Apple ID token with Apple's servers
    // For now, we'll create/update user based on the token
    // You'll need to implement proper Apple token verification

    // This is a simplified version - implement proper Apple Sign In verification
    res.status(501).json({ message: 'Apple Sign In verification not fully implemented. Use Google or email/password.' });
  } catch (error: any) {
    console.error('Apple OAuth error:', error);
    res.status(500).json({ message: error.message || 'Apple authentication failed' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token and generate new access token
    const { verifyRefreshToken } = require('../utils/jwt.utils');
    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error: any) {
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

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logout successful' });
});

export default router;

