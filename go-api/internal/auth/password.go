package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
	"strings"

	"golang.org/x/crypto/scrypt"
)

// Node.js scryptSync defaults: N=16384, r=8, p=1, keyLen=64
const (
	scryptN   = 16384
	scryptR   = 8
	scryptP   = 1
	scryptLen = 64
)

// HashPassword produces "hexSalt:hexHash" — identical format to Node.js auth.ts.
func HashPassword(password string) (string, error) {
	saltBytes := make([]byte, 16)
	if _, err := rand.Read(saltBytes); err != nil {
		return "", fmt.Errorf("rand salt: %w", err)
	}
	salt := hex.EncodeToString(saltBytes)

	hash, err := scrypt.Key([]byte(password), []byte(salt), scryptN, scryptR, scryptP, scryptLen)
	if err != nil {
		return "", fmt.Errorf("scrypt: %w", err)
	}
	return salt + ":" + hex.EncodeToString(hash), nil
}

// VerifyPassword checks a plaintext password against the stored "salt:hash" value.
func VerifyPassword(password, stored string) bool {
	parts := strings.SplitN(stored, ":", 2)
	if len(parts) != 2 {
		return false
	}
	salt, storedHex := parts[0], parts[1]

	derived, err := scrypt.Key([]byte(password), []byte(salt), scryptN, scryptR, scryptP, scryptLen)
	if err != nil {
		return false
	}

	storedBytes, err := hex.DecodeString(storedHex)
	if err != nil || len(derived) != len(storedBytes) {
		return false
	}
	return subtle.ConstantTimeCompare(derived, storedBytes) == 1
}
