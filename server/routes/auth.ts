import { Router, type Request, type Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getCurrentUser } from '../auth';
import { storage } from '../storage';

const router = Router();


router.use(getCurrentUser);


router.get('/me', (req: any, res: Response) => {
  const user = req.user || req.session?.user;
  const isAdmin = req.session?.isAdmin;
  
  if (!user && !isAdmin) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  
  if (isAdmin && !user) {
    return res.json({
      id: 'admin',
      username: 'falcon_admin',
      role: 'admin',
      provider: 'admin',
      isActive: true,
      firstName: 'Falcon',
      lastName: 'Admin'
    });
  }

  
  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    provider: user.provider,
    profileImageUrl: user.profileImageUrl,
    isActive: user.isActive,
    lastLogin: user.lastLogin
  };

  res.json(safeUser);
});


router.get('/profile', async (req: any, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    const isAdmin = req.session?.isAdmin;
    
    if (!user && !isAdmin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    
    if (isAdmin && !user) {
      return res.json({
        id: 'admin',
        username: 'falcon_admin',
        role: 'admin',
        provider: 'admin',
        firstName: 'Falcon',
        lastName: 'Admin'
      });
    }

    
    const dbUser = await storage.getUser(user.id);
    
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      bio: dbUser.bio,
      profileImageUrl: dbUser.profileImageUrl,
      role: dbUser.role,
      provider: dbUser.provider,
      lastLogin: dbUser.lastLogin,
      createdAt: dbUser.createdAt
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/profile', requireAuth, async (req: any, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { username, firstName, lastName, bio } = req.body;

    
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser && existingUser.id !== user.id) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    
    const updatedUser = await storage.upsertUser({
      id: user.id,
      username: username.trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      bio: bio?.trim(),
      updatedAt: new Date()
    });

    
    await storage.createAuditLog({
      userId: user.id,
      action: 'profile_update',
      resource: 'user',
      details: { updatedFields: ['username', 'firstName', 'lastName', 'bio'] },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info'
    });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      bio: updatedUser.bio,
      profileImageUrl: updatedUser.profileImageUrl,
      role: updatedUser.role,
      provider: updatedUser.provider
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    
    
    res.json([]);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/status', (req: any, res: Response) => {
  const user = req.user || req.session?.user;
  
  res.json({
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || !!req.session?.isAdmin,
    user: user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      provider: user.provider
    } : null
  });
});

export default router;