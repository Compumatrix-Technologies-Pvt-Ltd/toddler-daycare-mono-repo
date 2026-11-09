import { Router, Request, Response } from "express";

const router = Router();

router.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(422).json({
      message: "The given data was invalid.",
      errors: {
        ...(!email ? { email: ["Email address is required."] } : {}),
        ...(!password ? { password: ["Password is required."] } : {}),
      },
    });
    return;
  }

  res.json({
    data: {
      user: {
        id: "usr-1",
        email,
        role: email.includes("admin") ? "super-admin" : "caretaker",
        name: email.includes("admin") ? "System Admin" : "Maria Weber",
      },
      token: "demo-jwt-access-token",
      refreshToken: "demo-jwt-refresh-token",
    },
  });
});

router.post("/auth/refresh", (_req: Request, res: Response) => {
  res.json({
    data: {
      token: "demo-jwt-refreshed-token",
    },
  });
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.json({
    data: {
      success: true,
      message: "Successfully logged out.",
    },
  });
});

router.post("/auth/forgot-password", (req: Request, res: Response) => {
  const { email } = req.body || {};
  if (!email) {
    res.status(422).json({
      message: "The given data was invalid.",
      errors: { email: ["Email address is required."] },
    });
    return;
  }

  res.json({
    data: {
      message: "Password reset link has been dispatched to your email address.",
    },
  });
});

export default router;

