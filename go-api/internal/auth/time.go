package auth

import "time"

func timeNowUnix() int64 {
	return time.Now().Unix()
}
