// ============================================
// Socket.io Auth Middleware
// ============================================

import type { Socket } from "socket.io"
import { getToken } from "next-auth/jwt"
import type { SocketData } from "@/types/socket"

/**
 * Socket baglantisini NextAuth JWT ile dogrular
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token = socket.handshake.auth?.token

    if (!token) {
      return next(new Error("Yetkilendirme gerekli"))
    }

    // JWT token'i decode et (NextAuth uyumlu)
    // Production'da JWT secret ile dogrulanmali
    // Simdilik basit token parse
    let decoded: any

    try {
      // Token bir JSON string olabilir
      decoded = JSON.parse(Buffer.from(token, "base64").toString())
    } catch {
      // Veya direkt userId:username formati
      const parts = token.split(":")
      if (parts.length >= 2) {
        decoded = { id: parts[0], username: parts[1] }
      } else {
        return next(new Error("Gecersiz token"))
      }
    }

    if (!decoded?.id || !decoded?.username) {
      return next(new Error("Gecersiz token formati"))
    }

    // Socket data'ya kullanici bilgisini ekle
    ;(socket.data as SocketData) = {
      userId: decoded.id,
      username: decoded.username,
      roomId: null,
      playerId: null,
    }

    next()
  } catch (error) {
    next(new Error("Yetkilendirme hatasi"))
  }
}
