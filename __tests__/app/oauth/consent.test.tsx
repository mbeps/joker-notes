import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ConsentPage from "@/app/oauth/consent/page";

let mockSearchParams = new URLSearchParams({
  client_id: "chatgpt",
  redirect_uri: "https://chatgpt.com/callback",
  scope: "openid",
  state: "xyz",
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

let mockUserContext = {
  isLoaded: true,
  isSignedIn: true,
  user: { id: "user_test", fullName: "Test User" },
};

vi.mock("@clerk/nextjs", () => ({
  useUser: () => mockUserContext,
  UserButton: () => <div data-testid="user-button">UserButton</div>,
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("app/oauth/consent/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams({
      client_id: "chatgpt",
      redirect_uri: "https://chatgpt.com/callback",
      scope: "openid",
      state: "xyz",
    });
    mockUserContext = {
      isLoaded: true,
      isSignedIn: true,
      user: { id: "user_test", fullName: "Test User" },
    };
  });

  it("renders loading state when user is not loaded yet", () => {
    mockUserContext = {
      isLoaded: false,
      isSignedIn: false,
      user: null as any,
    };

    render(<ConsentPage />);
    expect(screen.queryByText("Authorise Application")).toBeNull();
  });

  it("renders sign in required message when user is not signed in", () => {
    mockUserContext = {
      isLoaded: true,
      isSignedIn: false,
      user: null as any,
    };

    render(<ConsentPage />);
    expect(screen.getByText("Sign In Required")).toBeDefined();
    expect(screen.getByText(/Please sign in to your Joker Notes account/)).toBeDefined();
    expect(screen.getByText("Sign In with Clerk")).toBeDefined();
  });

  it("renders consent card with permissions and client name when signed in", () => {
    render(<ConsentPage />);

    expect(screen.getByText("Authorise Application")).toBeDefined();
    expect(screen.getByText("ChatGPT")).toBeDefined();
    expect(screen.getByText("Read and manage your notes")).toBeDefined();
    expect(screen.getByText("Offline access")).toBeDefined();
    expect(screen.getByText("Deny")).toBeDefined();
    expect(screen.getByText("Allow Access")).toBeDefined();
  });

  it("handles deny decision and redirects", async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: "" } as any;

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ redirect_url: "https://chatgpt.com/callback?error=access_denied" }),
    });

    render(<ConsentPage />);
    const denyButton = screen.getByText("Deny");
    fireEvent.click(denyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/oauth/consent",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"decision":"deny"'),
        }),
      );
      expect(window.location.href).toBe("https://chatgpt.com/callback?error=access_denied");
    });

    window.location = originalLocation;
  });

  it("handles allow decision and redirects with code", async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: "" } as any;

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ redirect_url: "https://chatgpt.com/callback?code=test-auth-code" }),
    });

    render(<ConsentPage />);
    const allowButton = screen.getByText("Allow Access");
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/oauth/consent",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"decision":"allow"'),
        }),
      );
      expect(window.location.href).toBe("https://chatgpt.com/callback?code=test-auth-code");
    });

    window.location = originalLocation;
  });
});

