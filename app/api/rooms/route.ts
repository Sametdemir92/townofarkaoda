// ============================================
// Oda API Route'lari
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRoomCode } from "@/lib/utils"

// ---- Oda Olustur ----
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Giris yapmaniz gerekli" },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const roomName = body.name || `Oda ${Math.floor(Math.random() * 1000)}`

    const userId = (session.user as any).id

    // Benzersiz oda kodu olustur
    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.room.findUnique({ where: { code } })
      if (!existing) break
      code = generateRoomCode()
      attempts++
    }

    // Oda olustur
    const room = await prisma.room.create({
      data: {
        code,
        name: roomName,
        hostId: userId,
      },
    })

    // Host'u oyuncu olarak ekle
    await prisma.player.create({
      data: {
        userId,
        roomId: room.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: { roomId: room.id, roomCode: room.code },
    })
  } catch (error) {
    console.error("Oda olusturma hatasi:", error)
    return NextResponse.json(
      { success: false, error: "Oda olusturulurken hata olustu" },
      { status: 500 }
    )
  }
}

// ---- Aktif Odalari Listele ----
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: "WAITING" },
      include: {
        players: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      data: rooms.map((r: any) => ({
        id: r.id,
        code: r.code,
        name: r.name || `Oda ${r.code}`,
        playerCount: r.players.length,
        maxPlayers: r.maxPlayers,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error("Oda listeleme hatasi:", error)
    return NextResponse.json(
      { success: false, error: "Odalar getirilirken hata olustu" },
      { status: 500 }
    )
  }
}
