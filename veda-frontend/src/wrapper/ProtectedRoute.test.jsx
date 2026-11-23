import { render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../access/AuthProvider";
import { isTokenExpired } from "../services/apiClient";
import {
  clearAuthStorage,
  getAuthRole,
  getAuthToken,
  getRefreshToken,
  setAuthFlashMessage,
} from "../utils/authStorage";

jest.mock("../access/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../services/apiClient", () => ({
  isTokenExpired: jest.fn(),
}));

jest.mock("../utils/authStorage", () => ({
  clearAuthStorage: jest.fn(),
  getAuthRole: jest.fn(),
  getAuthToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setAuthFlashMessage: jest.fn(),
}));

// The guard only needs Navigate and Outlet. Mocking them keeps this test
// independent of react-router's ESM-only build.
jest.mock("react-router-dom", () => {
  const React = require("react");
  return {
    Navigate: ({ to }) =>
      React.createElement("div", { "data-testid": "navigate" }, to),
    Outlet: () => React.createElement("div", null, "outlet-page"),
  };
});

function renderGuard() {
  return render(<ProtectedRoute allowedRoles={["admin"]} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ authReady: true });
  getAuthToken.mockReturnValue("valid-token");
  getRefreshToken.mockReturnValue("refresh-token");
  getAuthRole.mockReturnValue("admin");
  isTokenExpired.mockReturnValue(false);
});

test("does not render or redirect until tab ownership is ready", () => {
  useAuth.mockReturnValue({ authReady: false });

  renderGuard();

  expect(screen.queryByText("outlet-page")).toBeNull();
  // A duplicated tab must not be bounced before its ownership check finishes.
  expect(screen.queryByTestId("navigate")).toBeNull();
});

test("renders protected content for an authenticated, owned tab", () => {
  renderGuard();
  expect(screen.getByText("outlet-page")).toBeInTheDocument();
});

test("redirects to login when no token exists", () => {
  getAuthToken.mockReturnValue(null);
  getRefreshToken.mockReturnValue(null);

  renderGuard();
  expect(screen.getByTestId("navigate")).toHaveTextContent("/");
});

test("clears an expired session with no refresh token before redirecting", () => {
  isTokenExpired.mockReturnValue(true);
  getRefreshToken.mockReturnValue(null);

  renderGuard();

  expect(screen.getByTestId("navigate")).toHaveTextContent("/");
  expect(clearAuthStorage).toHaveBeenCalled();
  expect(setAuthFlashMessage).toHaveBeenCalledWith(
    expect.stringMatching(/expired/i)
  );
});

test("redirects a wrong role to the unauthorized page", () => {
  getAuthRole.mockReturnValue("parent");

  renderGuard();
  expect(screen.getByTestId("navigate")).toHaveTextContent("/unauthorized");
});
