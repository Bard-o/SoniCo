import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";

// Mock supabase
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: (args: any) => mockSignInWithPassword(args),
      signInWithOAuth: (args: any) => mockSignInWithOAuth(args),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockFrom(),
        }),
      }),
    }),
  },
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockResolvedValue({ data: { role: "user" }, error: null });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });
    mockSignInWithOAuth.mockResolvedValue({ error: null });
  });

  it("renders login form with email and password fields", () => {
    renderLogin();

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" })
    ).toBeInTheDocument();
    expect(screen.getByText("Continuar con Google")).toBeInTheDocument();
  });

  it("shows link to register page", () => {
    renderLogin();

    const registerLink = screen.getByText("Regístrate");
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
  });

  it("calls signInWithPassword on form submit", async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });
  });

  it("shows error message on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "wrong@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "wrong" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(
        screen.getByText("Correo o contraseña inválidos.")
      ).toBeInTheDocument();
    });
  });

  it("calls signInWithOAuth on Google button click", async () => {
    renderLogin();

    fireEvent.click(screen.getByText("Continuar con Google"));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: expect.objectContaining({
          redirectTo: expect.stringContaining("/login"),
        }),
      });
    });
  });
});
