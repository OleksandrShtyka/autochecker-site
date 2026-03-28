package ai

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/autochecker/api/internal/auth"
	"github.com/autochecker/api/internal/config"
)

const groqBase = "https://api.groq.com/openai/v1"

var groqClient = &http.Client{Timeout: 60 * time.Second}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}

// groqPost sends a request to Groq and streams/returns the response body.
func groqPost(endpoint string, payload any) ([]byte, int, error) {
	b, err := json.Marshal(payload)
	if err != nil {
		return nil, 500, err
	}

	req, err := http.NewRequest(http.MethodPost, groqBase+endpoint, bytes.NewReader(b))
	if err != nil {
		return nil, 500, err
	}
	req.Header.Set("Authorization", "Bearer "+config.C.GroqAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := groqClient.Do(req)
	if err != nil {
		return nil, 502, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return body, resp.StatusCode, nil
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────

func Chat(w http.ResponseWriter, r *http.Request) {
	auth.GetSession(r) // already validated by middleware

	var body struct {
		Messages []map[string]string `json:"messages"`
		Model    string              `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	model := body.Model
	if model == "" {
		model = "llama-3.3-70b-versatile"
	}

	payload := map[string]any{
		"model":       model,
		"messages":    body.Messages,
		"max_tokens":  1024,
		"temperature": 0.7,
	}

	respBody, status, err := groqPost("/chat/completions", payload)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "AI service unavailable"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(respBody) //nolint:errcheck
}

// ── POST /api/ai/food-analyze ─────────────────────────────────────────────────

func FoodAnalyze(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ImageBase64 string `json:"imageBase64"`
		MimeType    string `json:"mimeType"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	if body.ImageBase64 == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "imageBase64 is required"})
		return
	}

	mimeType := body.MimeType
	if mimeType == "" {
		mimeType = "image/jpeg"
	}

	payload := map[string]any{
		"model": "llama-3.2-90b-vision-preview",
		"messages": []map[string]any{
			{
				"role": "user",
				"content": []map[string]any{
					{
						"type": "image_url",
						"image_url": map[string]string{
							"url": "data:" + mimeType + ";base64," + body.ImageBase64,
						},
					},
					{
						"type": "text",
						"text": `Analyze this food image and return ONLY a JSON object with these fields:
{
  "name": "food name",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams),
  "servingSize": "estimated serving size",
  "confidence": "high|medium|low"
}
No markdown, no explanation — pure JSON only.`,
					},
				},
			},
		},
		"max_tokens":  512,
		"temperature": 0.1,
	}

	respBody, status, err := groqPost("/chat/completions", payload)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "AI service unavailable"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(respBody) //nolint:errcheck
}

// ── POST /api/ai/voice-action ─────────────────────────────────────────────────

func VoiceAction(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Transcript string `json:"transcript"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "Invalid JSON"})
		return
	}

	if body.Transcript == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"message": "transcript is required"})
		return
	}

	payload := map[string]any{
		"model": "llama-3.3-70b-versatile",
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": `You are a gym session parser. Extract workout data from the user's voice transcript and return ONLY a JSON object with these fields: {"sessionType":"strength|cardio|flexibility|mixed","durationMinutes":number,"exercises":[{"name":"string","sets":number,"reps":number,"weightKg":number}],"notes":"string"}. No markdown, no explanation.`,
			},
			{
				"role":    "user",
				"content": body.Transcript,
			},
		},
		"max_tokens":  512,
		"temperature": 0.1,
	}

	respBody, status, err := groqPost("/chat/completions", payload)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"message": "AI service unavailable"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(respBody) //nolint:errcheck
}
