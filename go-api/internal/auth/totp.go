package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1" //nolint:gosec // TOTP (RFC 6238) requires SHA-1
	"encoding/binary"
	"fmt"
	"strings"
)

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

func base32Encode(buf []byte) string {
	var sb strings.Builder
	bits, value := 0, 0
	for _, b := range buf {
		value = (value << 8) | int(b)
		bits += 8
		for bits >= 5 {
			sb.WriteByte(base32Alphabet[(value>>(bits-5))&31])
			bits -= 5
		}
	}
	if bits > 0 {
		sb.WriteByte(base32Alphabet[(value<<(5-bits))&31])
	}
	return sb.String()
}

func base32Decode(s string) ([]byte, error) {
	s = strings.TrimRight(strings.ToUpper(s), "=")
	var out []byte
	bits, value := 0, 0
	for _, ch := range s {
		idx := strings.IndexRune(base32Alphabet, ch)
		if idx < 0 {
			return nil, fmt.Errorf("invalid base32 char: %c", ch)
		}
		value = (value << 5) | idx
		bits += 5
		if bits >= 8 {
			out = append(out, byte((value>>(bits-8))&0xff))
			bits -= 8
		}
	}
	return out, nil
}

// hotp computes an HTOP code per RFC 4226.
func hotp(secret []byte, counter uint64) string {
	msg := make([]byte, 8)
	binary.BigEndian.PutUint64(msg, counter)

	mac := hmac.New(sha1.New, secret) //nolint:gosec
	mac.Write(msg)
	h := mac.Sum(nil)

	offset := h[len(h)-1] & 0x0f
	code := (uint32(h[offset]&0x7f) << 24) |
		(uint32(h[offset+1]) << 16) |
		(uint32(h[offset+2]) << 8) |
		uint32(h[offset+3])
	return fmt.Sprintf("%06d", code%1_000_000)
}

// GenerateTotpSecret creates a 160-bit (20-byte) base32-encoded TOTP secret.
func GenerateTotpSecret() (string, error) {
	b := make([]byte, 20)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base32Encode(b), nil
}

// VerifyTotp checks a 6-digit code against secret with ±windowSize step tolerance.
func VerifyTotp(secret, code string, windowSize int) bool {
	key, err := base32Decode(secret)
	if err != nil {
		return false
	}
	step := uint64(timeNowUnix() / 30)
	for i := -windowSize; i <= windowSize; i++ {
		if hotp(key, uint64(int64(step)+int64(i))) == code {
			return true
		}
	}
	return false
}

// BuildOtpAuthURI returns the otpauth:// URI for QR code generation.
func BuildOtpAuthURI(secret, email, issuer string) string {
	return fmt.Sprintf(
		"otpauth://totp/%s%%3A%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
		issuer, email, secret, issuer,
	)
}
