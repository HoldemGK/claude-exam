import { describe, test, expect, vi, beforeEach } from "vitest";

const { mockCookieStore, mockSignJWT, mockSign, mockJwtVerify } = vi.hoisted(() => {
  const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
  const mockSignJWT = vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  }));
  const mockJwtVerify = vi.fn();
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };
  return { mockCookieStore, mockSignJWT, mockSign, mockJwtVerify };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));
vi.mock("jose", () => ({
  SignJWT: mockSignJWT,
  jwtVerify: mockJwtVerify,
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { NextRequest } from "next/server";

const COOKIE_NAME = "auth-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("signs a JWT and sets the auth cookie", async () => {
    await createSession("user-123", "user@example.com");

    expect(mockSignJWT).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-123", email: "user@example.com" })
    );
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      COOKIE_NAME,
      "mock-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      })
    );
  });

  test("sets cookie with secure flag in production", async () => {
    const originalEnv = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "production");

    await createSession("user-123", "user@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      COOKIE_NAME,
      "mock-jwt-token",
      expect.objectContaining({ secure: true })
    );

    vi.unstubAllEnvs();
  });

  test("sets cookie without secure flag outside production", async () => {
    await createSession("user-123", "user@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      COOKIE_NAME,
      "mock-jwt-token",
      expect.objectContaining({ secure: false })
    );
  });
});

describe("getSession", () => {
  test("returns null when no cookie is present", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const session = await getSession();

    expect(session).toBeNull();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  test("returns session payload when token is valid", async () => {
    const payload = { userId: "user-123", email: "user@example.com", expiresAt: new Date() };
    mockCookieStore.get.mockReturnValue({ value: "valid-token" });
    mockJwtVerify.mockResolvedValue({ payload });

    const session = await getSession();

    expect(mockJwtVerify).toHaveBeenCalledWith("valid-token", expect.anything());
    expect(session).toEqual(payload);
  });

  test("returns null when token verification fails", async () => {
    mockCookieStore.get.mockReturnValue({ value: "invalid-token" });
    mockJwtVerify.mockRejectedValue(new Error("Invalid token"));

    const session = await getSession();

    expect(session).toBeNull();
  });
});

describe("deleteSession", () => {
  test("deletes the auth cookie", async () => {
    await deleteSession();

    expect(mockCookieStore.delete).toHaveBeenCalledWith(COOKIE_NAME);
  });
});

describe("verifySession", () => {
  test("returns null when no cookie in request", async () => {
    const request = new NextRequest("http://localhost/api/test");

    const session = await verifySession(request);

    expect(session).toBeNull();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  test("returns session payload when request token is valid", async () => {
    const payload = { userId: "user-456", email: "other@example.com", expiresAt: new Date() };
    mockJwtVerify.mockResolvedValue({ payload });

    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: `${COOKIE_NAME}=valid-token` },
    });

    const session = await verifySession(request);

    expect(mockJwtVerify).toHaveBeenCalledWith("valid-token", expect.anything());
    expect(session).toEqual(payload);
  });

  test("returns null when request token verification fails", async () => {
    mockJwtVerify.mockRejectedValue(new Error("Expired token"));

    const request = new NextRequest("http://localhost/api/test", {
      headers: { cookie: `${COOKIE_NAME}=expired-token` },
    });

    const session = await verifySession(request);

    expect(session).toBeNull();
  });
});
