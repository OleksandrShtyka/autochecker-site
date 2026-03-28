package payments

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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

var planPrices = map[string]struct {
	Amount string
	Days   int
	Label  string
}{
	"monthly":  {"7.99", 30, "GYM Tracker Premium — 1 Month"},
	"6month":   {"34.99", 180, "GYM Tracker Premium — 6 Months"},
	"12month":  {"49.99", 365, "GYM Tracker Premium — 12 Months"},
	"24month":  {"79.99", 730, "GYM Tracker Premium — 24 Months"},
}

func paypalBase() string {
	if config.C.PayPalMode == "live" {
		return "https://api-m.paypal.com"
	}
	return "https://api-m.sandbox.paypal.com"
}

var ppClient = &http.Client{Timeout: 15 * time.Second}

func getPayPalToken() (string, error) {
	base := paypalBase()
	req, _ := http.NewRequest(http.MethodPost, base+"/v1/oauth2/token",
		bytes.NewBufferString("grant_type=client_credentials"))
	req.SetBasicAuth(config.C.PayPalClientID, config.C.PayPalClientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := ppClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("paypal token: %s", string(b))
	}

	var data struct {
		AccessToken string `json:"access_token"`
	}
	json.NewDecoder(resp.Body).Decode(&data) //nolint:errcheck
	return data.AccessToken, nil
}

// ── POST /api/payments/paypal/create-order ────────────────────────────────────

func CreateOrder(w http.ResponseWriter, r *http.Request) {
	s := auth.GetSession(r)

	var body struct {
		Plan string `json:"plan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	planInfo, ok := planPrices[body.Plan]
	if !ok {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid plan"})
		return
	}

	token, err := getPayPalToken()
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "PayPal unavailable"})
		return
	}

	siteURL := config.C.SiteURL
	orderPayload := map[string]any{
		"intent": "CAPTURE",
		"purchase_units": []map[string]any{
			{
				"reference_id": fmt.Sprintf("%s:%s", s.ID, body.Plan),
				"description":  planInfo.Label,
				"amount": map[string]string{
					"currency_code": "USD",
					"value":         planInfo.Amount,
				},
			},
		},
		"application_context": map[string]string{
			"brand_name": "GYM Tracker",
			"return_url": siteURL + "/pricing?payment=success&plan=" + body.Plan,
			"cancel_url": siteURL + "/pricing?payment=cancelled",
			"user_action": "PAY_NOW",
		},
	}

	b, _ := json.Marshal(orderPayload)
	req, _ := http.NewRequest(http.MethodPost, paypalBase()+"/v2/checkout/orders", bytes.NewReader(b))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := ppClient.Do(req)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "PayPal error"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "PayPal create-order failed"})
		return
	}

	var order struct {
		ID    string `json:"id"`
		Links []struct {
			Rel  string `json:"rel"`
			Href string `json:"href"`
		} `json:"links"`
	}
	json.NewDecoder(resp.Body).Decode(&order) //nolint:errcheck

	approveURL := ""
	for _, l := range order.Links {
		if l.Rel == "approve" {
			approveURL = l.Href
			break
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"orderId":    order.ID,
		"approveUrl": approveURL,
	})
}

// ── POST /api/payments/paypal/capture-order ───────────────────────────────────

func CaptureOrder(w http.ResponseWriter, r *http.Request) {
	s := auth.GetSession(r)

	var body struct {
		OrderID string `json:"orderId"`
		Plan    string `json:"plan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	planInfo, ok := planPrices[body.Plan]
	if !ok || body.OrderID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid request"})
		return
	}

	token, err := getPayPalToken()
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "PayPal unavailable"})
		return
	}

	req, _ := http.NewRequest(
		http.MethodPost,
		paypalBase()+"/v2/checkout/orders/"+body.OrderID+"/capture",
		bytes.NewBufferString("{}"),
	)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := ppClient.Do(req)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "PayPal capture error"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "Payment capture failed"})
		return
	}

	var captured struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}
	json.NewDecoder(resp.Body).Decode(&captured) //nolint:errcheck

	if captured.Status != "COMPLETED" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Payment not completed"})
		return
	}

	expiresAt := time.Now().UTC().Add(time.Duration(planInfo.Days) * 24 * time.Hour).Format(time.RFC3339)
	if err := db.UpsertSubscription(s.ID, body.Plan, &expiresAt, &captured.ID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Could not save subscription"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"plan":      body.Plan,
		"expiresAt": expiresAt,
		"orderId":   captured.ID,
	})
}
