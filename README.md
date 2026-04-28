# TaskFlow — Kanban Proje Yönetim Tahtası

Trello tarzı, sade ama özellik açısından zengin bir Kanban tahtası. Sürükle-bırak ile kartları sütunlar arasında taşıyabilir, ekibinle paylaşıp roller atayabilir, etiket / öncelik / son teslim tarihi / yorum ekleyebilirsin. Sıralama her sayfa yenilemesinde aynen korunur.

> Bu proje Koç Sistem değerlendirme süreci kapsamında hazırlanmıştır.
> **Yazar:** Doğukan Taha Tıraş — [LinkedIn](https://www.linkedin.com/in/dogukantahatiras/) · [GitHub](https://github.com/dodovlski)
> **AI Geliştirme:** Tüm uygulama [Claude Code](https://claude.com/claude-code) (Opus 4.7 ve Sonnet 4.6 modelleri) ile çift-pilot şeklinde geliştirilmiştir.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack, Server Actions)
- **Prisma 7** + **libSQL** — local: `file:./dev.db`, prod: Turso (`libsql://...`). Aynı driver, schema, migrations.
- **Auth:** Custom JWT cookie (`jose` + `bcryptjs`) — Next 16 uyumlu, httpOnly + sameSite=lax
- **Sürükle-bırak:** `@dnd-kit/core` + `@dnd-kit/sortable` (nested sortable, mouse + touch + keyboard sensors)
- **Sıralama:** `fractional-indexing` (LexoRank tarzı) — kart taşımada tek satır UPDATE
- **Validation:** `zod` (her server action giriş şeması)
- **UI:** Tailwind CSS v4, `lucide-react`, `sonner` (toast)

## Özellikler

### Çekirdek
- Hesap oluşturma ve giriş (email + password, bcrypt hash, 30 gün JWT cookie)
- Board oluşturma / silme
- Sütun ekleme, yeniden adlandırma, renklendirme (6 renk), silme, sürükleyerek yeniden sıralama
- Kart ekleme, düzenleme, silme; kartı sütun içinde ve sütunlar arası sürükleme
- Sıralama her durumda korunur — sayfa yenilense bile

### Kart Detayları
- Başlık + açıklama
- **Öncelik** (none / low / medium / high) — renkli sol kenar şeridi
- **Son teslim tarihi** — geç kalanlar / yaklaşanlar için renkli rozet
- **Etiketler** (board-level CRUD, 6 renk, karta multi-assign)
- **Yorumlar** (zaman damgalı, yazar veya owner silebilir)

### Paylaşım & Roller
- E-posta ile davet (`Share` butonu, owner'a özel)
- Üç rol: **OWNER** / **EDITOR** / **VIEWER**
- Henüz kayıtlı olmayan kullanıcılar `BoardInvite` olarak bekler; ilk giriş yaptıklarında otomatik üye olur
- VIEWER rolü tüm UI'da salt-okunur — mutate edilemez
- Tüm server actions her istekte rolü tekrar doğrular (defense in depth)

### Mobil
- `TouchSensor` 200ms uzun-basma + 8px tolerans → yanlışlıkla scroll'u sürükleme olarak yorumlamaz
- Klavye sensörü erişilebilirlik için aktif
- Yatay scroll'lu sütun şeridi — küçük ekranlarda kullanılabilir

## Mimari Kararlar

### Sıralama — Fractional Indexing
Her `Column` ve `Card` bir `order: String` taşır. İki komşu arasına yeni anahtar `generateKeyBetween(prev, next)` ile üretilir → **tek satır UPDATE**. Tüm kolonun yeniden numaralandırılması gerekmez. DB index'leri `[boardId, order]` ve `[columnId, order]`.

### Sürükle-bırak
- Tek `DndContext`, iki seviyeli `SortableContext` (sütunlar horizontal, kartlar vertical)
- `MouseSensor` + `TouchSensor(200ms)` + `KeyboardSensor` — masaüstü, mobil, erişilebilirlik
- `onDragOver`: kart sütunlar arası taşınırken local state anında güncellenir (ghost feedback)
- `onDragEnd`: hedef komşulardan yeni `order` hesaplanır → optimistic UI → server action → hata → otomatik rollback (`initialBoard` snapshot'ına dönüş)
- `DragOverlay` ile sürüklenen kartın gölge + hafif rotasyon ipucu

### Yetkilendirme
- `requireUser()` → JWT doğrulama
- `requireBoardAccess(boardId, minRole)` → ROLE_RANK karşılaştırması
- Her server action önce kullanıcıyı, sonra kaynak sahipliğini ve rolü doğrular
- VIEWER server-side mutation'ları tetikleyemez — UI sadece görsel kilit, asıl koruma backend'de

### Optimistic UI
Tüm mutate eden aksiyonlar (kart taşıma, ekleme, silme, etiket toggle, yorum, vb.) önce local state'i günceller, sonra `useTransition` içinde server action'ı çağırır. Hata olursa `toast.error` + `setBoard(initialBoard)` ile snapshot'a geri dönülür.

## Kurulum

```bash
npm install
npx prisma migrate dev          # veritabanı şemasını uygula
npx tsx prisma/seed.ts          # demo kullanıcı + tahta (opsiyonel)
npm run dev
```

Demo hesap: `demo@kocsprint.local` / `demo12345`

> `.env` içinde `AUTH_SECRET` üretim için mutlaka değiştirilmeli (`openssl rand -base64 32`).

## Production Deploy (Vercel + Turso)

Schema/kod değişmez — sadece env vars farklı.

1. [turso.tech](https://turso.tech) hesabı aç, yeni database oluştur.
2. CLI ile bağlantı bilgilerini al:
   ```bash
   turso db show <db-name> --url
   turso db tokens create <db-name>
   ```
3. Migrations'ı remote db'ye uygula (lokalden, bir kerelik):
   ```bash
   DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="..." npx prisma migrate deploy
   ```
4. Vercel'de proje oluştur, GitHub repo'yu bağla, env vars ekle:
   - `DATABASE_URL=libsql://...turso.io`
   - `DATABASE_AUTH_TOKEN=...`
   - `AUTH_SECRET=$(openssl rand -base64 32)`
5. Push → otomatik deploy.

## Veri Modeli (özet)

```
User ─┬─< Board (owner) ─┬─< Column ─< Card ─┬─< CardLabel >─ Label
      │                  │                   └─< Comment
      └─< BoardMember    ├─< BoardInvite
                         └─< Label
```

- `Board.ownerId` → tek sahip, transferi ayrı eylem değil
- `BoardMember(boardId, userId, role)` → uniq composite key
- `BoardInvite(boardId, email, role)` → kayıtsız kullanıcılar için bekleyen davet
- `Comment(cardId, userId, body)` → cascade delete
- `Label(boardId, name, color)` ve `CardLabel(cardId, labelId)` → many-to-many

## Bilinçli Kapsam Dışı

- Real-time collab (WebSocket / Liveblocks) — 48 saatlik pencere için iyi bir trade-off değil
- Activity log (kart hareketi geçmişi) — şimdilik yok
- Card assignee — etiket + üye listesi ile dolaylı çözülüyor
- Undo / redo
- Card cover image / attachment

## Komutlar

| Komut | Ne Yapar |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npx prisma migrate dev` | Yeni migration oluştur & uygula |
| `npx prisma studio` | Veritabanı GUI |
| `npx tsx prisma/seed.ts` | Demo veriyi yükle |

## Proje Hakkında — Detaylı Açıklama

Çalışan uygulamada `/about` sayfası, brief'teki her soruyu ve nasıl çözüldüğünü kart kart açıklar. Geliştirme süreci, kütüphane seçim gerekçeleri ve mimari kararlar oradadır.
