import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from "dotenv"

dotenv.config()

async function testGemini() {
    console.log("=== Gemini API Test ===")
    console.log("API Key mevcut mu:", !!process.env.GEMINI_API_KEY)
    console.log("API Key (ilk 10 karakter):", process.env.GEMINI_API_KEY?.substring(0, 10) + "...")

    if (!process.env.GEMINI_API_KEY) {
        console.error("HATA: GEMINI_API_KEY .env dosyasinda bulunamadi!")
        return
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        console.log("\nGemini'ye istek gonderiliyor...")

        const prompt = `Sen "Town of Salem" tarzı bir oyunda oynayan "Mehmet (Bot)" adlı bir oyuncusun. Rolün: MAFYA. Herkes seni duyuyor. Kısa, doğal bir Türkçe cümle yaz. Sadece cümleyi ver, başka bir şey yazma.`

        const result = await model.generateContent(prompt)
        const text = result.response.text().trim()

        console.log("Gemini cevabi:", text)
        console.log("\n=== TEST BASARILI ===")
    } catch (error: any) {
        console.error("HATA:", error.message)
        if (error.message?.includes("API_KEY")) {
            console.error("API Key gecersiz veya hatali olabilir.")
        }
        if (error.message?.includes("quota")) {
            console.error("API kotasi dolmus olabilir.")
        }
        console.error("Tam hata:", error)
    }
}

testGemini()
