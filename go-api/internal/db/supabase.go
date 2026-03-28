package db

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/autochecker/api/internal/config"
)

var client = &http.Client{Timeout: 10 * time.Second}

// ── Generic REST helper ────────────────────────────────────────────────────────

type reqOpts struct {
	Method      string
	Path        string
	Body        any
	Prefer      string
	Select      string
	AllowEmpty  bool
}

func do(opts reqOpts, out any) error {
	url := strings.TrimRight(config.C.SupabaseURL, "/") + "/rest/v1/" + opts.Path

	var bodyReader io.Reader
	if opts.Body != nil {
		b, err := json.Marshal(opts.Body)
		if err != nil {
			return fmt.Errorf("marshal body: %w", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	method := opts.Method
	if method == "" {
		method = http.MethodGet
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return err
	}

	req.Header.Set("apikey", config.C.SupabaseServiceKey)
	req.Header.Set("Authorization", "Bearer "+config.C.SupabaseServiceKey)
	req.Header.Set("Content-Type", "application/json")

	if opts.Prefer != "" {
		req.Header.Set("Prefer", opts.Prefer)
	}
	if opts.Select != "" {
		q := req.URL.Query()
		q.Set("select", opts.Select)
		req.URL.RawQuery = q.Encode()
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("http: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase %d: %s", resp.StatusCode, string(b))
	}

	if out != nil && resp.StatusCode != http.StatusNoContent {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil && !opts.AllowEmpty {
			return fmt.Errorf("decode: %w", err)
		}
	}
	return nil
}

// ── User ──────────────────────────────────────────────────────────────────────

const userSelect = "id,email,name,password_hash,auth_role,usage,favorite_feature,job_role,avatar_url,totp_secret,totp_enabled,created_at"

type User struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	Name         string `json:"name"`
	PasswordHash string `json:"password_hash"`
	AuthRole     string `json:"auth_role"`
	Usage        string `json:"usage"`
	JobRole      string `json:"job_role"`
	AvatarURL    string `json:"avatar_url"`
	TotpSecret   string `json:"totp_secret"`
	TotpEnabled  bool   `json:"totp_enabled"`
}

func FindUserByEmail(email string) (*User, error) {
	var rows []User
	err := do(reqOpts{
		Path:   fmt.Sprintf("users?email=eq.%s&limit=1", email),
		Select: userSelect,
	}, &rows)
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	return &rows[0], nil
}

func FindUserByID(id string) (*User, error) {
	var rows []User
	err := do(reqOpts{
		Path:   fmt.Sprintf("users?id=eq.%s&limit=1", id),
		Select: userSelect,
	}, &rows)
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	return &rows[0], nil
}

type CreateUserInput struct {
	Email        string `json:"email"`
	Name         string `json:"name"`
	PasswordHash string `json:"password_hash"`
	AuthRole     string `json:"auth_role"`
	JobRole      string `json:"job_role"`
	Usage        string `json:"usage"`
}

func CreateUser(input CreateUserInput) (*User, error) {
	var rows []User
	err := do(reqOpts{
		Method: http.MethodPost,
		Path:   "users",
		Body:   input,
		Prefer: "return=representation",
		Select: userSelect,
	}, &rows)
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	return &rows[0], nil
}

func UpdatePassword(userID, hash string) error {
	return do(reqOpts{
		Method:     http.MethodPatch,
		Path:       fmt.Sprintf("users?id=eq.%s", userID),
		Body:       map[string]string{"password_hash": hash},
		AllowEmpty: true,
	}, nil)
}

func DeleteUser(userID string) error {
	return do(reqOpts{
		Method:     http.MethodDelete,
		Path:       fmt.Sprintf("users?id=eq.%s", userID),
		AllowEmpty: true,
	}, nil)
}

// ── TOTP ──────────────────────────────────────────────────────────────────────

func SetTotpSecret(userID, secret string) error {
	return do(reqOpts{
		Method:     http.MethodPatch,
		Path:       fmt.Sprintf("users?id=eq.%s", userID),
		Body:       map[string]any{"totp_secret": secret, "totp_enabled": false},
		AllowEmpty: true,
	}, nil)
}

func EnableTotp(userID string) error {
	return do(reqOpts{
		Method:     http.MethodPatch,
		Path:       fmt.Sprintf("users?id=eq.%s", userID),
		Body:       map[string]bool{"totp_enabled": true},
		AllowEmpty: true,
	}, nil)
}

func DisableTotp(userID string) error {
	return do(reqOpts{
		Method:     http.MethodPatch,
		Path:       fmt.Sprintf("users?id=eq.%s", userID),
		Body:       map[string]any{"totp_secret": nil, "totp_enabled": false},
		AllowEmpty: true,
	}, nil)
}

// ── Subscription ──────────────────────────────────────────────────────────────

type Subscription struct {
	Plan      string  `json:"plan"`
	Status    string  `json:"status"`
	ExpiresAt *string `json:"expires_at"`
}

func GetSubscription(userID string) (*Subscription, error) {
	var rows []Subscription
	err := do(reqOpts{
		Path:   fmt.Sprintf("subscriptions?user_id=eq.%s&select=plan,status,expires_at&limit=1", userID),
	}, &rows)
	if err != nil || len(rows) == 0 {
		return nil, err
	}
	return &rows[0], nil
}

func UpsertSubscription(userID, plan string, expiresAt *string, paypalOrderID *string) error {
	body := map[string]any{
		"user_id":    userID,
		"plan":       plan,
		"status":     "active",
		"expires_at": expiresAt,
		"updated_at": time.Now().UTC().Format(time.RFC3339),
	}
	if paypalOrderID != nil {
		body["paypal_order_id"] = *paypalOrderID
	}
	return do(reqOpts{
		Method:     http.MethodPost,
		Path:       "subscriptions",
		Body:       body,
		Prefer:     "resolution=merge-duplicates",
		AllowEmpty: true,
	}, nil)
}

func ActivateTrial(userID string) error {
	existing, _ := GetSubscription(userID)
	if existing != nil {
		return fmt.Errorf("trial already used")
	}
	exp := time.Now().UTC().Add(15 * 24 * time.Hour).Format(time.RFC3339)
	return UpsertSubscription(userID, "trial", &exp, nil)
}
