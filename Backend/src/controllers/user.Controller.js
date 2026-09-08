import User from '../models/user.model.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, profileImage } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error('Please fill in all required fields (name, email, password)');
    }

    if (name?.trim().length < 3) {
      res.status(400);
      throw new Error('Name must be at least 3 characters');
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password?.trim())) {
      res.status(400);
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter and one number');
    }

    if (confirmPassword?.trim() && password?.trim() !== confirmPassword?.trim()) {
      res.status(400);
      throw new Error('Passwords do not match');
    }

    if (password?.trim().length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters');
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email?.trim())) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    const userExists = await User.findOne({ email: email?.trim()?.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email address');
    }

    const user = await User.create({
      name: name?.trim(),
      email: email?.trim()?.toLowerCase(),
      password: password?.trim(),
      profileImage: profileImage || undefined,
    });

    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        token,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email: email?.trim()?.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        token,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (Name, Profile Image)
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.email && req.body.email.toLowerCase() !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
        if (emailExists) {
          res.status(400);
          throw new Error('Email address is already in use by another user');
        }
        user.email = req.body.email.toLowerCase();
      }

      user.name = req.body.name || user.name;
      if (req.body.profileImage !== undefined) {
        user.profileImage = req.body.profileImage;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
export const changeUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Please provide both current password and new password');
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      res.status(400);
      throw new Error('New passwords do not match');
    }

    if (newPassword.length < 8) {
      res.status(400);
      throw new Error('New password must be at least 8 characters');
    }

    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(400);
      throw new Error('Incorrect current password');
    }
  } catch (error) {
    next(error);
  }
};
