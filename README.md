# Town of Arkaoda

Town of Salem benzeri, tarayici tabanli, online multiplayer sosyal cikarim oyunu.

## Teknoloji Yigini

- **Framework:** Next.js 14 (App Router)
- **Dil:** TypeScript
- **UI:** TailwindCSS + shadcn/ui
- **State Management:** Zustand
- **Realtime:** Socket.io (Custom Server)
- **Veritabani:** PostgreSQL (Prisma ORM)
- **Auth:** NextAuth (Credentials)

## Kurulum

### 1. Bagimliklar

```bash
npm install
```

### 2. Environment Degiskenleri

`.env` dosyasi olusturun (`.env.example` ornegine bakin):

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
NEXTAUTH_SECRET="rastgele-guclu-bir-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Veritabani

```bash
# Schema'yi veritabanina push et
npm run db:push

# Prisma Studio (veritabanini goruntulemek icin)
npm run db:studio
```

### 4. Gelistirme Sunucusu

```bash
npm run dev
```

Tarayicinizda `http://localhost:3000` adresini acin.

### 5. Production Build

```bash
npm run build
npm start
```

## Oyun Mekanigi

### Roller

| Rol | Takim | Gece Yetenegi | Kazanma Kosulu |
|-----|-------|---------------|----------------|
| Mafya | Mafya | Bir oyuncuyu oldurur | Kasaba sayisi <= Mafya sayisi |
| Doktor | Kasaba | Bir oyuncuyu korur | Tum mafyalar olur |
| Dedektif | Kasaba | Bir oyuncuyu sorusturur | Tum mafyalar olur |
| Vatandas | Kasaba | Yok | Tum mafyalar olur |

### Rol Dagitimi

- Mafya: `floor(oyuncu_sayisi / 4)` (min 1)
- Doktor: 1
- Dedektif: 1
- Vatandas: Geri kalan

### Oyun Akisi

1. Lobby olusturulur, oyuncular katilir (5-15 oyuncu)
2. Host oyunu baslatir, roller rastgele atanir
3. **Gece (30sn):** Mafya oldurme, Doktor koruma, Dedektif sorusturma
4. **Gunduz - Tartisma (60sn):** Herkes konusur
5. **Gunduz - Oylama (30sn):** Cogunluk eler, beraberlikte kimse olmez
6. Kazanma kosulu kontrolu -> Devam veya bitis

### Chat Sistemi

- **Gunduz:** Herkes PUBLIC kanalda konusabilir
- **Gece:** Sadece mafya uyeleri MAFIA kanalinda konusabilir
- Olu oyuncular konusamaz

## Proje Yapisi

```
townofarkaoda/
├── server.ts              # Custom server (Next.js + Socket.io)
├── app/                   # Next.js App Router sayfalari
│   ├── page.tsx           # Ana sayfa
│   ├── auth/              # Giris/Kayit sayfalari
│   ├── oda/[roomId]/      # Oyun odasi sayfasi
│   └── api/               # API route'lari
├── components/            # React bilesenleri
│   ├── ui/                # shadcn/ui temel bilesenler
│   ├── lobby/             # Bekleme odasi
│   ├── oyun/              # Oyun ekrani bilesenleri
│   └── oyun-sonu/         # Sonuc ekrani
├── lib/                   # Yardimci fonksiyonlar
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # NextAuth config
│   ├── socket.ts          # Client socket
│   └── store/             # Zustand store'lari
├── server/                # Sunucu tarafli kod
│   ├── socket/            # Socket.io handler'lari
│   └── game/              # Oyun motoru
│       ├── engine.ts      # State machine
│       ├── roles/         # Rol sinflari
│       ├── phases/        # Faz cozumleyicileri
│       └── win-conditions.ts
├── prisma/schema.prisma   # Veritabani semasi
└── types/                 # TypeScript tipleri
```

## Guvenlik

- Tum oyun mantigi sunucu tarafinda calisir
- Socket.io baglantilari JWT ile dogrulanir
- Roller client'a sadece kendi rolu olarak gonderilir
- Olu oyuncular aksiyon yapamaz
- Faz kontrolu: Yanlis fazda aksiyon gonderilemez

## Deployment

### Vercel + Railway

1. Railway'de PostgreSQL olusturun
2. Vercel'e deploy edin
3. Environment degiskenlerini ayarlayin

**Not:** Socket.io custom server gerektirdigi icin Vercel'de serverless calisamaz.
Railway veya Render gibi persistent server destekleyen platformlar oneriliyor.

### Railway Deploy

```bash
# Railway CLI ile
railway init
railway up
```

## Lisans

ISC
