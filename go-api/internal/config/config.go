package config

import (
	"log"
	"os"
)

type Config struct {
	Port              string
	SupabaseURL       string
	SupabaseServiceKey string
	SessionSecret     string
	GroqAPIKey        string
	AdminEmail        string
	PayPalClientID    string
	PayPalClientSecret string
	PayPalMode        string // "sandbox" | "live"
	SiteURL           string
}

var C Config

func Load() {
	C = Config{
		Port:               getEnv("PORT", "8080"),
		SupabaseURL:        mustEnv("SUPABASE_URL"),
		SupabaseServiceKey: mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
		SessionSecret:      mustEnv("SESSION_SECRET"),
		GroqAPIKey:         mustEnv("GROQ_API_KEY"),
		AdminEmail:         getEnv("ADMIN_EMAIL", ""),
		PayPalClientID:     mustEnv("PAYPAL_CLIENT_ID"),
		PayPalClientSecret: mustEnv("PAYPAL_CLIENT_SECRET"),
		PayPalMode:         getEnv("PAYPAL_MODE", "sandbox"),
		SiteURL:            getEnv("SITE_URL", "https://autochecker-site.vercel.app"),
	}
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
