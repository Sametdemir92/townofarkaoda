// ============================================
// Town of Arkaoda - Custom Server
// Next.js + Socket.io Entegrasyonu
// ============================================

import { createServer } from "http"
import next from "next"
import { initSocketServer } from "./server/socket"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler as any)

  // Socket.io server'i baslat
  initSocketServer(httpServer)

  httpServer.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║     🏘️  Town of Arkaoda Server          ║
║     http://${hostname}:${port}               ║
║     Mode: ${dev ? "Development" : "Production"}              ║
╚══════════════════════════════════════════╝
    `)
  })
})
