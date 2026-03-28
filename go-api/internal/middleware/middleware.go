package middleware

import (
	"net/http"
	"strings"

	"github.com/autochecker/api/internal/auth"
)

// JSON writes a JSON error and status code.
func JSON(w http.ResponseWriter, status int, body string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write([]byte(body)) //nolint:errcheck
}

// RequireAuth extracts the session cookie, validates it, and stores the
// SessionPayload in the request context. Returns 401 if missing/invalid.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(auth.SessionCookieName)
		if err != nil {
			JSON(w, http.StatusUnauthorized, `{"message":"Unauthorized"}`)
			return
		}

		session := auth.ParseSessionToken(cookie.Value)
		if session == nil {
			JSON(w, http.StatusUnauthorized, `{"message":"Unauthorized"}`)
			return
		}

		ctx := auth.WithSession(r.Context(), session)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// NormalizeEmail trims and lowercases an email.
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
