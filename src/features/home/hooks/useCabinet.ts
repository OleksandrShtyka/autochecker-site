"use client";

import { useEffect, useMemo, useState } from "react";
import type {
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
          const profilePayload = await readJson<{ profile: CabinetProfile }>(profileResponse);
          setProfile(profilePayload.profile);
        }

        if (suggestionsResponse.ok) {
          const suggestionsPayload = await readJson<{ suggestions: SuggestionRecord[] }>(
            suggestionsResponse
          );
          setHistory(suggestionsPayload.suggestions);
        }
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

    const payload = await readJson<{ profile: CabinetProfile }>(response);
    setProfile(payload.profile);
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
        const profilePayload = await readJson<{ profile: CabinetProfile }>(profileResponse);
        setProfile(profilePayload.profile);
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
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setSessionUser(null);
    setProfile(INITIAL_PROFILE);
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
  };

  return {
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
  };
}
