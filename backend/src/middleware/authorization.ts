import { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      res.status(401).json({
        error: "Authorization header is required.",
      });
      return;
    }

    const jwtToken = authorization.replace("Bearer ", "");

    // Verify token using Supabase client
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(jwtToken);

    if (error || !user) {
      res.status(401).json({
        error: "Invalid or expired token",
      });
      return;
    }

    req.user = { id: user.id };

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    res.status(401).json({
      error: "Invalid or expired token",
    });
    return;
  }
};
