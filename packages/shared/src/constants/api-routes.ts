export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    ROLES: "/admin/roles",
    PERMISSIONS: "/admin/permissions",
    APPLICATIONS: "/admin/applications",
    SETTINGS: "/admin/settings",
  },
  DAYCARES: {
    LIST: "/daycares",
    DETAIL: (id: string | number) => `/daycares/${id}`,
    SPOTS: (id: string | number) => `/daycares/${id}/spots`,
    SEARCH: "/daycares/search",
  },
  CARETAKERS: {
    PROFILE: "/caretakers/profile",
    PERMITS: "/caretakers/permits",
    SLOTS: "/caretakers/slots",
    INQUIRIES: "/caretakers/inquiries",
  },
  INQUIRIES: {
    SUBMIT: "/inquiries",
    STATUS: (id: string | number) => `/inquiries/${id}`,
    BULK: "/inquiries/bulk",
  },
} as const;
