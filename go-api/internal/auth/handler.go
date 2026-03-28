package auth

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/autochecker/api/internal/config"
	"github.com/autochecker/api/internal/db"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}

func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    token,
		HttpOnly: true,
		Path:     "/",
		MaxAge:   SessionTTLSeconds,
		SameSite: http.SameSiteLaxMode,
		Secure:   true,
	})
}

func clearCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:    name,
		Value:   "",
		MaxAge:  -1,
		Path:    "/",
		Expires: time.Unix(0, 0),
	})
}

func setMFACookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     MFACookieName,
		Value:    token,
		HttpOnly: true,
		Path:     "/",
		MaxAge:   MFATTLSeconds,
		SameSite: http.SameSiteLaxMode,
		Secure:   true,
	})
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

func Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))
	if email == "" || body.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Email and password are required"})
		return
	}

	existing, _ := db.FindUserByEmail(email)
	if existing != nil {
		writeJSON(w, http.StatusConflict, map[string]string{"message": "Email already registered"})
		return
	}

	hash, err := HashPassword(body.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
		return
	}

	adminEmail := strings.ToLower(strings.TrimSpace(config.C.AdminEmail))
	authRole := "USER"
	if adminEmail != "" && email == adminEmail {
		authRole = "ADMIN"
	}

	user, err := db.CreateUser(db.CreateUserInput{
		Email:        email,
		Name:         body.Name,
		PasswordHash: hash,
		AuthRole:     authRole,
		JobRole:      "athlete",
		Usage:        "personal",
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Could not create user"})
		return
	}

	token, err := CreateSessionToken(SessionPayload{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
		Role:  user.AuthRole,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
		return
	}

	setSessionCookie(w, token)
	writeJSON(w, http.StatusCreated, map[string]any{
		"ok":   true,
		"user": map[string]string{"id": user.ID, "email": user.Email, "name": user.Name, "role": user.AuthRole},
	})
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

func Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))
	user, err := db.FindUserByEmail(email)
	if err != nil || user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Invalid credentials"})
		return
	}

	if !VerifyPassword(body.Password, user.PasswordHash) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Invalid credentials"})
		return
	}

	// MFA required?
	if user.TotpEnabled {
		mfaToken, err := CreateMFAToken(user.ID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
			return
		}
		setMFACookie(w, mfaToken)
		writeJSON(w, http.StatusOK, map[string]bool{"mfa_required": true})
		return
	}

	token, err := CreateSessionToken(SessionPayload{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
		Role:  user.AuthRole,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
		return
	}

	clearCookie(w, SessionCookieName)
	setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":   true,
		"user": map[string]string{"id": user.ID, "email": user.Email, "name": user.Name, "role": user.AuthRole},
	})
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

func Logout(w http.ResponseWriter, r *http.Request) {
	clearCookie(w, SessionCookieName)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// ── GET /api/auth/session ─────────────────────────────────────────────────────

func Session(w http.ResponseWriter, r *http.Request) {
	s := GetSession(r)
	if s == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]bool{"authenticated": false})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"authenticated": true,
		"user":          map[string]string{"id": s.ID, "email": s.Email, "name": s.Name, "role": s.Role},
	})
}

// ── PATCH /api/auth/password ──────────────────────────────────────────────────

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	s := GetSession(r)
	var body struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	user, err := db.FindUserByID(s.ID)
	if err != nil || user == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "User not found"})
		return
	}

	if !VerifyPassword(body.CurrentPassword, user.PasswordHash) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Current password is incorrect"})
		return
	}

	hash, err := HashPassword(body.NewPassword)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
		return
	}

	if err := db.UpdatePassword(s.ID, hash); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Could not update password"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// ── DELETE /api/auth/delete ───────────────────────────────────────────────────

func DeleteAccount(w http.ResponseWriter, r *http.Request) {
	s := GetSession(r)
	if err := db.DeleteUser(s.ID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Could not delete account"})
		return
	}
	clearCookie(w, SessionCookieName)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// ── POST /api/auth/totp/setup ─────────────────────────────────────────────────

func TotpSetup(w http.ResponseWriter, r *http.Request) {
	s := GetSession(r)
	secret, err := GenerateTotpSecret()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
		return
	}

	if err := db.SetTotpSecret(s.ID, secret); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Could not store TOTP secret"})
		return
	}

	uri := BuildOtpAuthURI(secret, s.Email, "AutoChecker")
	writeJSON(w, http.StatusOK, map[string]string{"secret": secret, "uri": uri})
}

// ── POST /api/auth/totp/enable ────────────────────────────────────────────────

func TotpEnable(w http.ResponseWriter, r *http.Request) {
	s := GetSession(r)
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	user, err := db.FindUserByID(s.ID)
	if err != nil || user == nil || user.TotpSecret == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "TOTP not set up"})
		return
	}

	if !VerifyTotp(user.TotpSecret, body.Code, 1) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Invalid TOTP code"})
		return
	}

	if err := db.EnableTotp(s.ID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Could not enable 2FA"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// ── DELETE /api/auth/totp/enable ─────────────────────────────────────────────

func TotpDisable(w http.ResponseWriter, r *http.Request) {
	s := GetSession(r)
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	user, err := db.FindUserByID(s.ID)
	if err != nil || user == nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"message": "User not found"})
		return
	}

	if !VerifyTotp(user.TotpSecret, body.Code, 1) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Invalid TOTP code"})
		return
	}

	if err := db.DisableTotp(s.ID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Could not disable 2FA"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

// ── POST /api/auth/totp/verify ────────────────────────────────────────────────

func TotpVerify(w http.ResponseWriter, r *http.Request) {
	mfaCookie, err := r.Cookie(MFACookieName)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "MFA session expired"})
		return
	}

	mfaPayload := ParseMFAToken(mfaCookie.Value)
	if mfaPayload == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "MFA session expired"})
		return
	}

	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	user, err := db.FindUserByID(mfaPayload.ID)
	if err != nil || user == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "User not found"})
		return
	}

	if !VerifyTotp(user.TotpSecret, body.Code, 1) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"message": "Invalid TOTP code"})
		return
	}

	token, err := CreateSessionToken(SessionPayload{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
		Role:  user.AuthRole,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Server error"})
		return
	}

	clearCookie(w, MFACookieName)
	setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":   true,
		"user": map[string]string{"id": user.ID, "email": user.Email, "name": user.Name, "role": user.AuthRole},
	})
}
