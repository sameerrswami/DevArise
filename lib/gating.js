import prisma from "@/lib/prisma";

export const LIMITS = {
  FREE: {
    MAX_INTERVIEWS: 2,
    MAX_RESUME_SCANS: 1,
    MAX_ROUTINES: 1
  },
  PREMIUM: {
    MAX_INTERVIEWS: 9999, // practically unlimited
    MAX_RESUME_SCANS: 9999,
    MAX_ROUTINES: 9999
  }
};

/**
 * Checks if a user has reached their limit for a specific feature.
 * Automatically checks their premium status via the database.
 * 
 * @param {string} userEmail - The email of the user
 * @param {string} feature - 'INTERVIEWS' | 'RESUME_SCANS' | 'ROUTINES'
 * @returns {Promise<{ allowed: boolean, isPremium: boolean, message?: string }>}
 */
export async function enforceLimits(userEmail, feature) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        isPremium: true,
        _count: {
          select: {
            // Mapping features to relational counts
            // Assumes some relations in schema. We map what we know.
            // Example: "INTERVIEWS" maps to 'mockInterviews' created by this user
            // We use raw queries or count if relation doesn't easily map in a single query
          }
        }
      }
    });

    if (!user) {
      return { allowed: false, isPremium: false, message: "User not found" };
    }

    const { isPremium } = user;
    
    // Quick escape for premium users to save DB calculation overhead
    if (isPremium) {
      return { allowed: true, isPremium: true };
    }

    const limitConfig = isPremium ? LIMITS.PREMIUM : LIMITS.FREE;

    // Feature specific checks
    if (feature === 'INTERVIEWS') {
      const interviewCount = await prisma.mockInterview.count({
        where: { createdBy: userEmail }
      });
      if (interviewCount >= limitConfig.MAX_INTERVIEWS) {
        return { 
          allowed: false, 
          isPremium, 
          message: `Free tier limit reached. You can only create ${limitConfig.MAX_INTERVIEWS} mock interviews. Upgrade to Premium for unlimited access.`
        };
      }
    }

    // Add other feature checks here as needed
    // if (feature === 'RESUME_SCANS') { ... }

    return { allowed: true, isPremium };
  } catch (error) {
    console.error("[Rate Limiting Error]", error);
    return { allowed: false, isPremium: false, message: "Internal server error during validation" };
  }
}
