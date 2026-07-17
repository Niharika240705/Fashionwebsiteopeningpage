import express, { Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import { Product } from '../models/Product.model';
import { Offer } from '../models/Offer.model';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
});

// Saved products
router.get('/saved-products', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const products = await Product.find({ _id: { $in: user.savedProductIds || [] } }).lean();
    const formatted = await Promise.all(
      products.map(async (product) => {
        const offer = await Offer.findOne({ productId: product._id, status: 'active' }).sort({ price: 1 }).lean();
        const images =
          product.images?.approved?.length > 0
            ? product.images.approved
            : product.images?.processed?.length > 0
              ? product.images.processed
              : [];
        return {
          id: product._id,
          name: product.name,
          brand: product.brand,
          price: offer?.price ?? product.price,
          images,
          offerId: offer?._id,
          redirectPath: offer?._id ? `/api/r/${offer._id}` : null,
          sellerName: offer?.sellerName || product.sourceWebsite,
        };
      })
    );

    res.json({ success: true, products: formatted });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get saved products' });
  }
});

router.post('/saved-products/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const productId = req.params.productId;
    const exists = await Product.exists({ _id: productId });
    if (!exists) return res.status(404).json({ message: 'Product not found' });

    if (!user.savedProductIds.includes(productId)) {
      user.savedProductIds.push(productId);
      await user.save();
    }

    res.json({ success: true, savedProductIds: user.savedProductIds });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to save product' });
  }
});

router.delete('/saved-products/:productId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedProductIds = (user.savedProductIds || []).filter((id) => id !== req.params.productId);
    await user.save();
    res.json({ success: true, savedProductIds: user.savedProductIds });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to remove saved product' });
  }
});

export default router;

