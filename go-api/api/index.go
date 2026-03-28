// Package handler is the Vercel Go serverless entry point.
// Vercel requires package name "handler" and exported func Handler(w, r).
package handler

import (
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/autochecker/api/internal/ai"
	"github.com/autochecker/api/internal/auth"
	"github.com/autochecker/api/internal/config"
	mw "github.com/autochecker/api/internal/middleware"
	"github.com/autochecker/api/internal/payments"
	"github.com/autochecker/api/internal/subscriptions"
)

var (
	router http.Handler
	once   sync.Once
)

func buildRouter() http.Handler {
	config.Load()

	r := chi.NewRouter()

	r.Use(chimw.Recoverer)
	r.Use(chimw.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://autochecker-site.vercel.app", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"ok":true}`)) //nolint:errcheck
	})

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", auth.Register)
		r.Post("/login", auth.Login)
		r.Post("/logout", auth.Logout)
		r.Post("/totp/verify", auth.TotpVerify)

		r.Group(func(r chi.Router) {
			r.Use(mw.RequireAuth)
			r.Get("/session", auth.Session)
			r.Patch("/password", auth.ChangePassword)
			r.Delete("/delete", auth.DeleteAccount)
			r.Post("/totp/setup", auth.TotpSetup)
			r.Post("/totp/enable", auth.TotpEnable)
			r.Delete("/totp/enable", auth.TotpDisable)
		})
	})

	r.Route("/api/ai", func(r chi.Router) {
		r.Use(mw.RequireAuth)
		r.Post("/chat", ai.Chat)
		r.Post("/food-analyze", ai.FoodAnalyze)
		r.Post("/voice-action", ai.VoiceAction)
	})

	r.Route("/api/subscriptions", func(r chi.Router) {
		r.Use(mw.RequireAuth)
		r.Get("/status", subscriptions.Status)
		r.Post("/trial", subscriptions.Trial)
	})

	r.Route("/api/payments/paypal", func(r chi.Router) {
		r.Use(mw.RequireAuth)
		r.Post("/create-order", payments.CreateOrder)
		r.Post("/capture-order", payments.CaptureOrder)
	})

	return r
}

// Handler is the Vercel serverless entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() { router = buildRouter() })
	router.ServeHTTP(w, r)
}
