require("dotenv").config()

const apiKey = process.env.GEMINI_API_KEY

async function test() {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

    try {
        const res = await fetch(listUrl)
        const data = await res.json()

        if (data.models) {
            const geminiModels = data.models.filter(m => m.name.includes("gemini") && m.supportedGenerationMethods?.includes("generateContent"))
            console.log("Kullanilabilir Gemini modelleri:")
            geminiModels.forEach(m => {
                console.log(" -", m.name)
            })

            // Ilk calisan modeli dene
            if (geminiModels.length > 0) {
                const modelName = geminiModels[0].name // "models/xxx" formatinda
                console.log("\nDenenen model:", modelName)

                const genUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`
                const genRes = await fetch(genUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: 'Sadece "Merhaba" yaz.' }] }] })
                })

                console.log("Generate Status:", genRes.status)
                const genData = await genRes.json()

                if (genData.candidates) {
                    console.log("CEVAP:", genData.candidates[0].content.parts[0].text)
                    console.log("\n=== BASARILI! Bu modeli kullanin:", modelName.replace("models/", ""), "===")
                } else {
                    console.log("Hata:", JSON.stringify(genData, null, 2))
                }
            }
        } else {
            console.log("Model listesi alinamadi:", JSON.stringify(data, null, 2))
        }
    } catch (err) {
        console.error("Hata:", err.message)
    }
}

test()
