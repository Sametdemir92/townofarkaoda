// ============================================
// Kayit API Route
// ============================================

import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // Validasyon
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Kullanici adi ve sifre gerekli" },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { success: false, error: "Kullanici adi 3-20 karakter olmali" },
        { status: 400 }
      )
    }

    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: "Sifre en az 4 karakter olmali" },
        { status: 400 }
      )
    }

    // Kullanici adi musait mi?
    const existing = await prisma.user.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Bu kullanici adi zaten alinmis" },
        { status: 409 }
      )
    }

    // Sifreyi hashle
    const hashedPassword = await hash(password, 12)

    // Kullanici olustur
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      success: true,
      data: { id: user.id, username: user.username },
    })
  } catch (error) {
    console.error("Kayit hatasi:", error)
    return NextResponse.json(
      { success: false, error: "Kayit sirasinda hata olustu" },
      { status: 500 }
    )
  }
}
