import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "@/pages/Register";

// Mock supabase
const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (args: any) => mockSignUp(args),
      signInWithOAuth: (args: any) => mockSignInWithOAuth(args),
    },
    from: () => ({}),
  },
}));

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // supabase.auth.signUp always resolves with a `data` envelope, even on
    // error. Omitting it here made Register blow up on `signUpData.session`.
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "token" } },
      error: null,
    });
    mockSignInWithOAuth.mockResolvedValue({ error: null });
  });

  it("renders register form with all fields", () => {
    renderRegister();

    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear cuenta" })
    ).toBeInTheDocument();
    expect(screen.getByText("Continuar con Google")).toBeInTheDocument();
  });

  it("shows link to login page", () => {
    renderRegister();

    const loginLink = screen.getByText("Inicia sesión");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
  });

  it("shows error when password is too short", async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(
        screen.getByText("La contraseña debe tener al menos 8 caracteres.")
      ).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "different456" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(
        screen.getByText("Las contraseñas no coinciden.")
      ).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("calls signUp with full_name on valid submit", async () => {
    renderRegister();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
        options: {
          data: {
            full_name: "Test User",
          },
        },
      });
    });
  });

  it("asks the user to confirm their email when signUp returns no session", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: null },
      error: null,
    });

    renderRegister();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Revisa tu correo para confirmar tu cuenta antes de iniciar sesión."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows error when email already exists", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    });

    renderRegister();

    fireEvent.change(screen.getByLabelText("Nombre completo"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "existing@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(
        screen.getByText("Este correo ya está registrado.")
      ).toBeInTheDocument();
    });
  });

  it("calls signInWithOAuth on Google button click", async () => {
    renderRegister();

    fireEvent.click(screen.getByText("Continuar con Google"));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: expect.objectContaining({
          redirectTo: expect.stringContaining("/register"),
        }),
      });
    });
  });
});
