import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let getToken = null;
    try {
      const mod = await import("next-auth/jwt");
      getToken = mod.getToken || mod.default?.getToken;
    } catch (e) {
      console.warn("[debug/auth] could not import getToken from next-auth/jwt", e);
    }

    let token = null;
    if (getToken) {
      token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    } else {
      const cookie = req.headers.get("cookie") || null;
      token = cookie ? { cookiePreview: cookie.substring(0, 200) } : null;
    }

    return NextResponse.json({
      tokenPresent: !!token,
      tokenInfo: token
        ? typeof token === "object"
          ? { sub: token?.sub ?? null, exp: token?.exp ?? null }
          : { preview: String(token).substring(0, 200) }
        : null,
      env: {
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
