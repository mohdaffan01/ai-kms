import { userRepository } from '../repositories/user.repository.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

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

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name?.trim())) {
      res.status(400);
      throw new Error('Name must contain only alphabets and spaces (no numbers allowed)');
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

    const userExists = await userRepository.findByEmail(email);
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email address');
    }

    const user = await userRepository.create({
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

    const user = await userRepository.findByEmail(email);

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
    const user = await userRepository.findByIdWithoutPassword(req.user._id);
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
    const user = await userRepository.findById(req.user._id);

    if (user) {
      if (req.body.email && req.body.email.toLowerCase() !== user.email) {
        const emailExists = await userRepository.findByEmail(req.body.email);
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

    const user = await userRepository.findById(req.user._id);

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

// @desc    Forgot Password - generate 6-digit OTP & send to email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      res.status(400);
      throw new Error('Please provide an email address');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      res.status(404);
      throw new Error('No registered account found with that email address');
    }

    // Generate secure resetToken
    const resetToken = user.getResetPasswordToken();

    // Clear any previous OTP and save token with expiry
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    console.log('\n===============================================');
    console.log(`🔐 [AiKMS DIRECT PASSWORD RESET LINK]`);
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`From Email: ${process.env.EMAIL_USER || 'mohdaffan338@gmail.com'}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Valid for: 30 minutes`);
    console.log('===============================================\n');

    // Send direct link email via Nodemailer
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #1c1d22; border-radius: 12px; color: #ececec; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #10a37f; margin: 0; font-size: 24px; font-weight: 700;">AiKMS</h2>
          <p style="color: #8e8e8e; font-size: 14px; margin-top: 4px;">AI Knowledge Management System</p>
        </div>
        <p style="font-size: 16px; margin-bottom: 12px;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #b4b4b4; line-height: 1.6; margin-bottom: 24px;">
          You requested to reset your password. Click the button below to directly choose your new password:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #10a37f; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);">
            Reset Password
          </a>
        </div>

        <p style="color: #8e8e8e; font-size: 13px; line-height: 1.5;">
          Or copy and paste this link in your browser:<br/>
          <a href="${resetUrl}" style="color: #10a37f; word-break: break-all; font-size: 12px;">${resetUrl}</a>
        </p>

        <p style="color: #8e8e8e; font-size: 13px; line-height: 1.4; margin-top: 20px;">
          This link will expire in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0 16px;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">Sent securely by AiKMS Security &bull; mohdaffan338@gmail.com</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Reset Your AiKMS Password',
      text: `Hello ${user.name},\n\nYou requested to reset your password. Click or paste this link to reset it:\n${resetUrl}\n\nThis link is valid for 30 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: emailHtml,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email address.',
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
export const resetPasswordWithOtp = async (req, res, next) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide both email and OTP code');
    }

    if (!password) {
      res.status(400);
      throw new Error('Please provide a new password');
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error('New password must be at least 8 characters long');
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400);
      throw new Error('New passwords do not match');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Hash the OTP to compare with DB
    const hashedOtp = crypto
      .createHash('sha256')
      .update(cleanOtp)
      .digest('hex');

    const user = await userRepository.findOne({
      email: normalizedEmail,
      resetPasswordOtp: hashedOtp,
      resetPasswordOtpExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid OTP or OTP has expired. Please check the code or request a new OTP.');
    }

    // Set new password (will be hashed in userSchema.pre('save'))
    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log(`✅ [PASSWORD RESET SUCCESSFUL] OTP verified for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with token (URL link compatibility)
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password) {
      res.status(400);
      throw new Error('Please provide a new password');
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password?.trim())) {
      res.status(400);
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter and one number');
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400);
      throw new Error('Passwords do not match');
    }

    // Hash the token received in URL params to match with DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await userRepository.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired password reset link');
    }

    // Set new password (will be hashed in userSchema.pre('save'))
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;

    await user.save();

    console.log(`✅ Password successfully reset for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};
