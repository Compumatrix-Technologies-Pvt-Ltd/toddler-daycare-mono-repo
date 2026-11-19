import { Request, Response } from "express";
import {
  recordSearchHistory,
  getNearbySearchHistoryForCaretaker,
  getAllSearchHistoryAdmin,
  cancelAndDeleteSearchHistory,
} from "../../services/caretaker/searchHistoryService.js";
import { runCleanupJob } from "../../services/cron/searchCleanupCron.js";
import { emitSearchHistoryUpdated } from "../../config/socket.js";

/**
 * POST /api/v1/parent/search-history
 * Record parent search demand history
 */
export async function createSearchHistory(req: Request, res: Response): Promise<void> {
  try {
    const {
      parentName,
      parentname,
      email,
      phone,
      message,
      note,
      scope,
      searchLocation,
      currentLocation,
      searchFilters,
      daycareIds,
      daycareNames,
      caretakerIds,
    } = req.body;

    if (!email || !phone) {
      res.status(400).json({
        success: false,
        message: "Email and phone are required to record parent search demand.",
      });
      return;
    }

    const recorded = await recordSearchHistory({
      parentName: parentName || parentname,
      email,
      phone,
      message: message || note,
      scope,
      searchLocation,
      currentLocation,
      searchFilters,
      daycareIds,
      daycareNames,
      caretakerIds,
    });

    res.status(201).json({
      success: true,
      message: "Parent search demand recorded for 30 days.",
      data: recorded,
    });
  } catch (err: any) {
    console.error("[SearchHistoryController] createSearchHistory error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to record parent search history.",
    });
  }
}

/**
 * GET /api/v1/caretaker/search-history
 * Protected endpoint for authenticated caretakers to view search history
 * within their daycare's catchment radius (30-day active window only).
 */
export async function getCaretakerNearbySearches(req: Request, res: Response): Promise<void> {
  try {
    const caretakerId = req.caretaker?.caretakerId;
    if (!caretakerId) {
      res.status(401).json({
        success: false,
        message: "Caretaker authentication required.",
      });
      return;
    }

    const result = await getNearbySearchHistoryForCaretaker(caretakerId);

    res.status(200).json({
      success: true,
      message: `Retrieved ${result.totalNearby} search demands within your daycare catchment radius.`,
      data: result,
    });
  } catch (err: any) {
    console.error("[SearchHistoryController] getCaretakerNearbySearches error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve nearby search history.",
    });
  }
}

/**
 * GET /api/v1/admin/search-history
 * Protected endpoint for admins to view all parent search history demands.
 */
export async function getAdminSearchHistory(req: Request, res: Response): Promise<void> {
  try {
    const { status, search, page, limit } = req.query;

    const result = await getAllSearchHistoryAdmin({
      status: (status as any) || "all",
      search: typeof search === "string" ? search : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        activeCount: result.activeCount,
        expiredCount: result.expiredCount,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (err: any) {
    console.error("[SearchHistoryController] getAdminSearchHistory error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve admin search history.",
    });
  }
}

/**
 * POST /api/v1/admin/search-history/cleanup
 * Manually trigger the 30-day expiration cron cleanup job on demand.
 */
export async function triggerSearchCleanup(req: Request, res: Response): Promise<void> {
  try {
    const expiredCount = await runCleanupJob();
    res.status(200).json({
      success: true,
      message: `30-Day search cleanup executed. Marked ${expiredCount} past records as expired.`,
      data: { expiredCount },
    });
  } catch (err: any) {
    console.error("[SearchHistoryController] triggerSearchCleanup error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to run search cleanup.",
    });
  }
}

/**
 * DELETE, POST & GET /api/v1/search/cancel
 * Cancel and delete 30-day parent search history demand from database.
 */
export async function cancelSearchHistory(req: Request, res: Response): Promise<void> {
  try {
    const referenceId = (
      req.body?.referenceId ||
      req.query?.ref ||
      req.query?.referenceId ||
      req.params?.id ||
      ""
    ) as string;
    const email = (req.body?.email || req.query?.email || "") as string;
    const inquiryId = (req.body?.inquiryId || req.query?.inquiryId || "") as string;

    if (!referenceId && !email && !inquiryId) {
      res.status(400).json({
        success: false,
        message: "Reference ID or email is required to cancel search history.",
      });
      return;
    }

    const result = await cancelAndDeleteSearchHistory({
      referenceId: referenceId.trim() || undefined,
      email: email.trim() || undefined,
      inquiryId: inquiryId.trim() || undefined,
    });

    emitSearchHistoryUpdated({
      referenceId: result.referenceId || referenceId,
      email,
      action: "deleted",
    });

    // If accessed via a browser GET request (e.g. email link fallback), redirect to web confirmation page
    if (req.method === "GET" && req.accepts("html")) {
      const webBaseUrl =
        process.env.WEB_URL || process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(
        `${webBaseUrl}/cancel-search?ref=${encodeURIComponent(
          result.referenceId || referenceId
        )}&status=deleted`
      );
      return;
    }

    res.status(200).json({
      success: true,
      message: "Parent search history and 30-day map visibility successfully deleted from database.",
      data: result,
    });
  } catch (err: any) {
    console.error("[SearchHistoryController] cancelSearchHistory error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to cancel and delete parent search history.",
    });
  }
}
