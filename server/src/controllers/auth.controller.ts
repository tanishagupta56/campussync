import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { config } from '../config/env';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, selectedRole } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AuthService.initiateLogin({
        email,
        password,
        selectedRole,
        ipAddress,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { challengeId, otp } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.verifyOtp({
        challengeId,
        otp,
        ipAddress,
        userAgent,
      });

      // Set secure httpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { challengeId } = req.body;
      const result = await AuthService.resendOtp({ challengeId });
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : '');
      if (token) {
        await AuthService.logout(token);
      }

      res.clearCookie('token', {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
      });

      return res.status(200).json({
        success: true,
        message: 'Successfully logged out.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'No active session.' });
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}
