import { Request, Response } from "express";
import { getSettingsService, updateSettingsService } from "@/services/admin/settings";

export const getPlatformSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getSettingsService();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve platform settings",
    });
  }
};

export const updatePlatformSettings = async (req: Request, res: Response) => {
  try {
    const settings = await updateSettingsService(req.body);
    res.json({
      success: true,
      message: "Platform settings updated successfully",
      data: settings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update platform settings",
    });
  }
};

