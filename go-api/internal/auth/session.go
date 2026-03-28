package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/autochecker/api/internal/config"
)

type ctxKey string

// CtxSessionKey is the context key used by RequireAuth middleware.
const CtxSessionKey ctxKey = "session"

// GetSession retrieves the SessionPayload from the request context.
func GetSession(r *http.Request) *SessionPayload {
	s, _ := r.Context().Value(CtxSessionKey).(*SessionPayload)
	return s
}

// WithSession returns a new context with the session stored.
func WithSession(ctx context.Context, s *SessionPayload) context.Context {
	return context.WithValue(ctx, CtxSessionKey, s)
}

// Session token format mirrors Next.js auth.ts exactly:
//   base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature)
// exp is in milliseconds (same as Date.now() in JS).

const (
	SessionCookieName  = "autochecker_session"
	SessionTTLSeconds  = 60 * 60 * 24 * 7 // 7 days
	MFACookieName      = "autochecker_mfa_pending"
	MFATTLSeconds      = 60 * 5 // 5 min
)

type SessionPayload struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
	Exp   int64  `json:"exp"` // Unix milliseconds
}

type MFAPayload struct {
	ID  string `json:"id"`
	Exp int64  `json:"exp"` // Unix milliseconds
}

func sign(value string) string {
	mac := hmac.New(sha256.New, []byte(config.C.SessionSecret))
	mac.Write([]byte(value))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func b64url(data []byte) string {
	return base64.RawURLEncoding.EncodeToString(data)
}

func deB64url(s string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(s)
}

// CreateSessionToken builds a signed token for the given session payload.
func CreateSessionToken(p SessionPayload) (string, error) {
	p.Exp = time.Now().UnixMilli() + int64(SessionTTLSeconds)*1000
	raw, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	encoded := b64url(raw)
	return encoded + "." + sign(encoded), nil
}

// ParseSessionToken validates and decodes a session token. Returns nil if invalid/expired.
func ParseSessionToken(token string) *SessionPayload {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return nil
	}
	encoded, provided := parts[0], parts[1]

	expected := sign(encoded)
	if subtle.ConstantTimeCompare([]byte(expected), []byte(provided)) != 1 {
		return nil
	}

	raw, err := deB64url(encoded)
	if err != nil {
		return nil
	}

	var p SessionPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		return nil
	}
	if p.Exp < time.Now().UnixMilli() {
		return nil
	}
	return &p
}

// CreateMFAToken creates a short-lived token used during TOTP verification.
func CreateMFAToken(userID string) (string, error) {
	p := MFAPayload{
		ID:  userID,
		Exp: time.Now().UnixMilli() + int64(MFATTLSeconds)*1000,
	}
	raw, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	encoded := b64url(raw)
	return encoded + "." + sign(encoded), nil
}

// ParseMFAToken validates and decodes an MFA pending token.
func ParseMFAToken(token string) *MFAPayload {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return nil
	}
	encoded, provided := parts[0], parts[1]

	expected := sign(encoded)
	if subtle.ConstantTimeCompare([]byte(expected), []byte(provided)) != 1 {
		return nil
	}

	raw, err := deB64url(encoded)
	if err != nil {
		return nil
	}

	var p MFAPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		return nil
	}
	if p.Exp < time.Now().UnixMilli() {
		return nil
	}
	return &p
}
