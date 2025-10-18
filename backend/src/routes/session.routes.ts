import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import SessionService from '../services/session.service';
import logger from '../utils/logger';

const router = Router();

/**
 * Session Routes
 * Manage user sessions, view active sessions, terminate sessions
 */

/**
 * GET /api/v1/sessions
 * Get active sessions for the current user
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any).id;
    const sessionService = SessionService.getInstance();
    
    const sessions = await sessionService.getActiveSessions(userId);
    
    res.json({
      success: true,
      data: {
        sessions,
        total: sessions.length,
      },
    });
  } catch (error) {
    logger.error('Get sessions error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SESSIONS_ERROR',
        message: 'Failed to retrieve sessions',
      },
    });
  }
});

/**
 * DELETE /api/v1/sessions
 * Terminate all sessions for the current user
 */
router.delete('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any).id;
    const sessionService = SessionService.getInstance();
    
    await sessionService.terminateUserSessions(userId);
    
    res.json({
      success: true,
      data: {
        message: 'All sessions terminated successfully',
      },
    });
  } catch (error) {
    logger.error('Terminate sessions error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'TERMINATE_SESSIONS_ERROR',
        message: 'Failed to terminate sessions',
      },
    });
  }
});

/**
 * GET /api/v1/sessions/stats
 * Get session statistics (admin only)
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    // Only Super Admins can view session stats
    if ((req.user as any).userType !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only Super Admins can view session statistics',
        },
      });
      return;
    }
    
    const sessionService = SessionService.getInstance();
    const stats = await sessionService.getSessionStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get session stats error', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SESSION_STATS_ERROR',
        message: 'Failed to retrieve session statistics',
      },
    });
  }
});

export default router;

