import PlatformSettingsModel from "@/modules/admin/settings";

export const getSettingsService = async () => {
  let settings = await PlatformSettingsModel.findOne();
  if (!settings) {
    settings = await PlatformSettingsModel.create({
      defaultCatchmentRadiusKm: 3.0,
      urbanCatchmentRadiusKm: 3.0,
      ruralCatchmentRadiusKm: 10.0,
      siteName: "Find Toddler Daycare",
      contactEmail: "admin@toddler-care.de",
      autoValidatePermits: true,
      emailNotificationOnInquiry: true,
      dailyDigestEnabled: true,
      allowPublicInquiries: true,
      maintenanceMode: false,
      sessionTimeoutMinutes: 60,
    });
  } else {
    // Ensure urban and rural defaults exist if migrating from old settings document
    let modified = false;
    if (settings.urbanCatchmentRadiusKm === undefined) {
      settings.urbanCatchmentRadiusKm = 3.0;
      modified = true;
    }
    if (settings.ruralCatchmentRadiusKm === undefined) {
      settings.ruralCatchmentRadiusKm = 10.0;
      modified = true;
    }
    if (modified) {
      await settings.save();
    }
  }
  return settings;
};

export const updateSettingsService = async (data: any) => {
  let settings = await PlatformSettingsModel.findOne();
  if (!settings) {
    settings = await PlatformSettingsModel.create(data);
  } else {
    // Only update provided fields
    if (data.defaultCatchmentRadiusKm !== undefined) {
      settings.defaultCatchmentRadiusKm = Number(data.defaultCatchmentRadiusKm);
    }
    if (data.urbanCatchmentRadiusKm !== undefined) {
      settings.urbanCatchmentRadiusKm = Number(data.urbanCatchmentRadiusKm);
    }
    if (data.ruralCatchmentRadiusKm !== undefined) {
      settings.ruralCatchmentRadiusKm = Number(data.ruralCatchmentRadiusKm);
    }
    if (data.siteName !== undefined) settings.siteName = data.siteName;
    if (data.contactEmail !== undefined) settings.contactEmail = data.contactEmail;
    if (data.autoValidatePermits !== undefined) settings.autoValidatePermits = Boolean(data.autoValidatePermits);
    if (data.emailNotificationOnInquiry !== undefined) settings.emailNotificationOnInquiry = Boolean(data.emailNotificationOnInquiry);
    if (data.dailyDigestEnabled !== undefined) settings.dailyDigestEnabled = Boolean(data.dailyDigestEnabled);
    if (data.allowPublicInquiries !== undefined) settings.allowPublicInquiries = Boolean(data.allowPublicInquiries);
    if (data.maintenanceMode !== undefined) settings.maintenanceMode = Boolean(data.maintenanceMode);
    if (data.sessionTimeoutMinutes !== undefined) settings.sessionTimeoutMinutes = Number(data.sessionTimeoutMinutes);

    await settings.save();
  }
  return settings;
};

