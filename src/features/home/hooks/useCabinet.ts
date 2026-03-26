"use client";

import { useEffect, useState } from "react";
import type {
  AccountData,
  ActionFeedback,
  AuthForm,
  AuthMode,
  CabinetProfile,
  Feature,
  SessionUser,
  SuggestionDraft,
  SuggestionRecord,
} from "../types";

const INITIAL_AUTH_FORM: AuthForm = {
  name: "",
  email: "",
  password: "",
};

const INITIAL_SUGGESTION: SuggestionDraft = {
  title: "",
  area: "UI / UX",
  summary: "",
  impact: "",
};

const INITIAL_PROFILE: CabinetProfile = {
  name: "",
  role: "Full-stack Developer",
  usage: "Daily",
  favoriteFeature: "Sidebar Dashboard",
};

const INITIAL_ACCOUNT_DATA: AccountData = {
  avatarUrl: "",
  connectedGoogle: false,
  googleEmail: "",
  connectedGithub: false,
  githubUsername: "",
};

type UseCabinetOptions = {
  features: Feature[];
};

async function readJson<T>(response: Response) {
  const raw = await response.text();
  if (!raw) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return {
      message: raw,
    } as T;
  }
}

export function useCabinet({ features }: UseCabinetOptions) {
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authForm, setAuthForm] = useState<AuthForm>(INITIAL_AUTH_FORM);
  const [profile, setProfile] = useState<CabinetProfile>(INITIAL_PROFILE);
  const [accountData, setAccountData] = useState<AccountData>(INITIAL_ACCOUNT_DATA);
  const [suggestion, setSuggestion] = useState<SuggestionDraft>(INITIAL_SUGGESTION);
  const [history, setHistory] = useState<SuggestionRecord[]>([]);
  const [authMessage, setAuthMessage] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  const defaultFavoriteFeature = features[0]?.title ?? "Sidebar Dashboard";

  useEffect(() => {
    setProfile((current) => ({
      ...current,
      favoriteFeature: current.favoriteFeature || defaultFavoriteFeature,
    }));
  }, [defaultFavoriteFeature]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const sessionResponse = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const sessionPayload = await readJson<{
          authenticated: boolean;
          user?: SessionUser;
        }>(sessionResponse);

        if (!sessionPayload.authenticated || !sessionPayload.user) {
          setSessionUser(null);
          return;
        }

        setSessionUser(sessionPayload.user);
        setAuthMode("login");

        const [profileResponse, suggestionsResponse] = await Promise.all([
          fetch("/api/cabinet/profile", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/cabinet/suggestions", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (profileResponse.ok) {
          const profilePayload = await readJson<{
            profile: CabinetProfile;
            accountData: AccountData;
          }>(profileResponse);
          setProfile(profilePayload.profile);
          if (profilePayload.accountData) {
            setAccountData(profilePayload.accountData);
          }
        }

        if (suggestionsResponse.ok) {
          const suggestionsPayload = await readJson<{ suggestions: SuggestionRecord[] }>(
            suggestionsResponse
          );
          setHistory(suggestionsPayload.suggestions);
        }
      } catch {
        // network or parse error on boot — silently degrade, user stays unauthenticated
      } finally {
        setIsBooting(false);
      }
    };

    void bootstrap();
  }, []);


  const isAuthenticated = sessionUser !== null;
  const isAdmin = sessionUser?.role === "ADMIN";

  const setAuthField = (field: keyof AuthForm, value: string) => {
    setAuthForm((current) => ({ ...current, [field]: value }));
  };

  const changeAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthMessage("");
  };

  const setSuggestionField = (field: keyof SuggestionDraft, value: string) => {
    setSuggestion((current) => ({ ...current, [field]: value }));
  };

  const persistProfile = async (nextProfile: CabinetProfile) => {
    try {
      const response = await fetch("/api/cabinet/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(nextProfile),
      });

      if (!response.ok) {
        const payload = await readJson<{ message?: string }>(response);
        setAuthMessage(payload.message ?? "Profile update failed.");
        return;
      }

      const payload = await readJson<{ profile: CabinetProfile; accountData: AccountData }>(response);
      setProfile(payload.profile);
      if (payload.accountData) setAccountData(payload.accountData);
    } catch {
      setAuthMessage("Network error — profile changes could not be saved.");
    }
  };

  const setProfileField = (field: keyof CabinetProfile, value: string) => {
    setProfile((current) => {
      const nextProfile = { ...current, [field]: value };
      if (sessionUser) {
        void persistProfile(nextProfile);
      }
      return nextProfile;
    });
  };

  const uploadAvatar = async (file: File): Promise<ActionFeedback> => {
    try {
      const response = await fetch("/api/cabinet/avatar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const payload = await readJson<{ ok?: boolean; avatarUrl?: string; message?: string }>(response);

      if (!response.ok || !payload.avatarUrl) {
        return {
          ok: false,
          title: "Upload failed",
          description: payload.message ?? "Could not upload profile picture.",
          tone: "error",
        };
      }

      setAccountData((current) => ({ ...current, avatarUrl: payload.avatarUrl! }));
      return {
        ok: true,
        title: "Photo updated",
        description: "Your profile picture has been saved.",
        tone: "success",
      };
    } catch {
      return {
        ok: false,
        title: "Upload failed",
        description: "Network error — could not upload photo.",
        tone: "error",
      };
    }
  };

  const removeAvatar = async (): Promise<ActionFeedback> => {
    try {
      const response = await fetch("/api/cabinet/avatar", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = await readJson<{ message?: string }>(response);
        return {
          ok: false,
          title: "Remove failed",
          description: payload.message ?? "Could not remove profile picture.",
          tone: "error",
        };
      }

      setAccountData((current) => ({ ...current, avatarUrl: "" }));
      return {
        ok: true,
        title: "Photo removed",
        description: "Your profile picture has been removed.",
        tone: "info",
      };
    } catch {
      return {
        ok: false,
        title: "Remove failed",
        description: "Network error — could not remove photo.",
        tone: "error",
      };
    }
  };

  const disconnectOAuth = async (provider: "google" | "github"): Promise<ActionFeedback> => {
    try {
      const response = await fetch(`/api/auth/oauth/${provider}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await readJson<{ ok?: boolean; accountData?: AccountData; message?: string }>(response);

      if (!response.ok) {
        return {
          ok: false,
          title: "Disconnect failed",
          description: payload.message ?? `Could not disconnect ${provider}.`,
          tone: "error",
        };
      }

      if (payload.accountData) setAccountData(payload.accountData);
      return {
        ok: true,
        title: "Account disconnected",
        description: `Your ${provider === "google" ? "Google" : "GitHub"} account has been unlinked.`,
        tone: "info",
      };
    } catch {
      return {
        ok: false,
        title: "Disconnect failed",
        description: "Network error.",
        tone: "error",
      };
    }
  };

  const submitAuth = async (): Promise<ActionFeedback> => {
    try {
      const endpoint =
        authMode === "register" ? "/api/auth/register" : "/api/auth/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(authForm),
      });

      const payload = await readJson<{
        ok: boolean;
        message?: string;
        user?: SessionUser;
      }>(response);

      if (!response.ok || !payload.user) {
        const feedback = {
          ok: false,
          title: authMode === "register" ? "Registration failed" : "Login failed",
          description:
            payload.message ??
            (authMode === "register"
              ? "Could not create account right now."
              : "Wrong email or password."),
          tone: "error" as const,
        };
        setAuthMessage(feedback.description);
        return feedback;
      }

      setSessionUser(payload.user);
      setAuthForm(INITIAL_AUTH_FORM);
      setProfile({
        name: payload.user.name,
        role: "Full-stack Developer",
        usage: "Daily",
        favoriteFeature: defaultFavoriteFeature,
      });

      const profileResponse = await fetch("/api/cabinet/profile", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (profileResponse.ok) {
        const profilePayload = await readJson<{
          profile: CabinetProfile;
          accountData: AccountData;
        }>(profileResponse);
        setProfile(profilePayload.profile);
        if (profilePayload.accountData) setAccountData(profilePayload.accountData);
      }

      setHistory([]);

      const feedback = {
        ok: true,
        title: authMode === "register" ? "Account created" : "Welcome back",
        description:
          authMode === "register"
            ? "Registration succeeded. Your cabinet is ready to use."
            : "Authorization succeeded. Opening your cabinet now.",
        tone: "success" as const,
      };
      setAuthMessage(feedback.description);
      return feedback;
    } catch (error) {
      const feedback = {
        ok: false,
        title: authMode === "register" ? "Registration failed" : "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Unexpected network or server error.",
        tone: "error" as const,
      };
      setAuthMessage(feedback.description);
      return feedback;
    }
  };

  const logout = async (): Promise<ActionFeedback> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors on logout — clear state regardless
    }

    setSessionUser(null);
    setProfile(INITIAL_PROFILE);
    setAccountData(INITIAL_ACCOUNT_DATA);
    setHistory([]);
    setSuggestion(INITIAL_SUGGESTION);

    const feedback = {
      ok: true,
      title: "Signed out",
      description: "Your current cabinet session has been closed.",
      tone: "info" as const,
    };
    setAuthMessage(feedback.description);
    return feedback;
  };

  const submitSuggestion = async (): Promise<ActionFeedback> => {
    try {
      const response = await fetch("/api/cabinet/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(suggestion),
      });

      const payload = await readJson<{
        ok?: boolean;
        message?: string;
        suggestions?: SuggestionRecord[];
      }>(response);

      if (!response.ok || !payload.suggestions) {
        const feedback = {
          ok: false,
          title: "Suggestion failed",
          description:
            payload.message ?? "Fill in title, description and impact before sending.",
          tone: "error" as const,
        };
        setAuthMessage(feedback.description);
        return feedback;
      }

      setHistory(payload.suggestions);
      setSuggestion(INITIAL_SUGGESTION);

      const feedback = {
        ok: true,
        title: "Suggestion sent",
        description: "Your idea was saved to the backend and is now visible in the admin panel.",
        tone: "success" as const,
      };
      setAuthMessage(feedback.description);
      return feedback;
    } catch (error) {
      const feedback = {
        ok: false,
        title: "Suggestion failed",
        description: error instanceof Error ? error.message : "Unexpected network error.",
        tone: "error" as const,
      };
      setAuthMessage(feedback.description);
      return feedback;
    }
  };

  return {
    accountData,
    authMode,
    authForm,
    authMessage,
    history,
    isAdmin,
    isAuthenticated,
    isBooting,
    profile,
    sessionUser,
    setAuthField,
    setAuthMode: changeAuthMode,
    setProfileField,
    setSuggestionField,
    submitAuth,
    submitSuggestion,
    suggestion,
    logout,
    uploadAvatar,
    removeAvatar,
    disconnectOAuth,
  };
}
