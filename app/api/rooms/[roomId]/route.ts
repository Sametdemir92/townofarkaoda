// ============================================
// Tekil Oda API Route
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ---- Oda Detayi ----
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Giris yapmaniz gerekli" },
        { status: 401 }
      )
    }

    const room = await prisma.room.findUnique({
      where: { id: params.roomId },
      include: {
        players: {
          include: { user: true },
        },
      },
    })

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Oda bulunamadi" },
        { status: 404 }
      )
    }

    const userId = (session.user as any).id

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        code: room.code,
        hostId: room.hostId,
        status: room.status,
        isHost: room.hostId === userId,
        players: room.players.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          username: p.user.username,
          isAlive: p.isAlive,
        })),
      },
    })
  } catch (error) {
    console.error("Oda detay hatasi:", error)
    return NextResponse.json(
      { success: false, error: "Oda bilgisi getirilirken hata olustu" },
      { status: 500 }
    )
  }
}
