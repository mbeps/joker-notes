import { describe, expect, it, vi } from "vitest";

const mockGetUserList = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  createClerkClient: vi.fn(() => ({
    users: { getUserList: mockGetUserList },
  })),
}));

import { POST } from "@/app/api/admin/users/route";

describe("app/api/admin/users", () => {
  it("returns an empty object for an empty or invalid userIds list", async () => {
    const res = await POST(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [] }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("maps user IDs to primary emails", async () => {
    mockGetUserList.mockResolvedValueOnce({
      data: [
        {
          id: "author_1",
          emailAddresses: [{ emailAddress: "alpha@example.com" }],
        },
        { id: "author_2", emailAddresses: [] },
      ],
    });

    const res = await POST(
      new Request("http://localhost:3000/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: ["author_1", "author_2"] }),
      }),
    );

    expect(mockGetUserList).toHaveBeenCalledWith({
      userId: ["author_1", "author_2"],
    });
    expect(await res.json()).toEqual({
      author_1: "alpha@example.com",
      author_2: "author_2",
    });
  });
});
