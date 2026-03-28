package subscriptions

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/autochecker/api/internal/auth"
	"github.com/autochecker/api/internal/config"
	"github.com/autochecker/api/internal/db"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}

// ── GET /api/subscriptions/status ────────────────────────────────────────────

func Status(w http.ResponseWriter, r *http.Request) {
	s := auth.GetSession(r)

	// Admin always has lifetime premium
	if s.Role == "ADMIN" {
		writeJSON(w, http.StatusOK, map[string]any{
			"authenticated": true,
			"isPremium":     true,
			"plan":          "lifetime",
			"status":        "active",
			"expiresAt":     nil,
		})
		return
	}

	sub, err := db.GetSubscription(s.ID)
	if err != nil || sub == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"authenticated": true,
			"isPremium":     false,
			"plan":          nil,
		})
		return
	}

	isActive := sub.Status == "active" &&
		(sub.ExpiresAt == nil || parseTime(*sub.ExpiresAt).After(time.Now()))

	writeJSON(w, http.StatusOK, map[string]any{
		"authenticated": true,
		"isPremium":     isActive,
		"plan":          sub.Plan,
		"status":        sub.Status,
		"expiresAt":     sub.ExpiresAt,
	})
}

// ── POST /api/subscriptions/trial ─────────────────────────────────────────────

func Trial(w http.ResponseWriter, r *http.Request) {
	s := auth.GetSession(r)

	existing, _ := db.GetSubscription(s.ID)
	if existing != nil {
		writeJSON(w, http.StatusConflict, map[string]string{"message": "Trial already used or subscription exists."})
		return
	}

	if err := db.ActivateTrial(s.ID); err != nil {
		if strings.Contains(err.Error(), "trial already used") {
			writeJSON(w, http.StatusConflict, map[string]string{"message": "Trial already used."})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
		return
	}

	expiresAt := time.Now().UTC().Add(15 * 24 * time.Hour).Format(time.RFC3339)
	writeJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"plan":      "trial",
		"expiresAt": expiresAt,
	})
}

func parseTime(s string) time.Time {
	t, _ := time.Parse(time.RFC3339, s)
	return t
}

// ── PayPal helpers ────────────────────────────────────────────────────────────

func paypalBase() string {
	if config.C.PayPalMode == "live" {
		return "https://api-m.paypal.com"
	}
	return "https://api-m.sandbox.paypal.com"
}
