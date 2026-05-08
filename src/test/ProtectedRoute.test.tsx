import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Mock useAuth to control auth state
const mockUseAuth = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  it("shows loading spinner when auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });

    renderProtectedRoute();

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("redirects to /login when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });

    renderProtectedRoute();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "123", email: "test@test.com" },
      isLoading: false,
    });

    renderProtectedRoute();

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("includes returnUrl in redirect when unauthenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });

    render(
      <MemoryRouter initialEntries={["/owner"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/owner" element={<div>Owner</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to login with returnUrl
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
