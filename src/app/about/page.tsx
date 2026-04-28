import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { getSession } from "@/lib/auth";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.35.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39s1.97.13 2.89.39c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.74 18.27.5 12 .5z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export const metadata = {
  title: "Proje Hakkında — Koç Sprint",
  description: "TaskFlow Kanban projesinin teknik detayları ve geliştirme süreci.",
};

export default async function AboutPage() {
  const session = await getSession();
  const homeHref = session ? "/boards" : "/";

  return (
    <>
      <header className="bg-brand-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href={homeHref} className="flex items-center gap-2 font-bold tracking-tight">
            <span className="inline-block h-5 w-1 bg-brand-red" />
            Koç Sprint
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/about" className="rounded-sm border border-white/30 bg-white/5 px-3 py-1.5 text-white">
              Proje Hakkında
            </Link>
            <Link
              href={homeHref}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-transparent px-3 py-1.5 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {session ? "Boards" : "Ana Sayfa"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10 space-y-12">

        {/* Giriş */}
        <section className="space-y-4">
          <div className="h-1 w-10 bg-brand-red" />
          <h1 className="text-4xl font-bold tracking-tight text-brand-dark">Proje Hakkında</h1>
          <p className="text-base leading-relaxed text-brand-muted max-w-3xl">
            Bu sayfada Koç Sistem değerlendirme sürecinde bana yöneltilen soruları ve bu projeyi
            nasıl çalıştığımı anlattım.
          </p>

          <div className="rounded-sm border border-brand-border bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-brand-dark">Hangi AI aracını kullandım ?</p>
                <p className="text-sm leading-relaxed text-brand-muted">
                  Tüm uygulamayı{" "}
                  <a
                    href="https://claude.com/claude-code"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-dark underline decoration-brand-red decoration-2 underline-offset-2"
                  >
                    Claude Code
                  </a>{" "}
                  CLI/IDE ortamında,{" "}
                  <span className="font-semibold text-brand-dark">Claude Opus 4.7</span> ve{" "}
                  <span className="font-semibold text-brand-dark">Claude Sonnet 4.6</span>{" "}
                  modellerini kullandım. Her mimari kararı ve kütüphane seçimini
                  modelle iki model ile birlikte tartıştım; üretilen kodun tamamını okuyup kendi süzgecimden geçirdikten sonra koda aldım.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="https://www.linkedin.com/in/dogukantahatiras/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-sm bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark-hover transition-colors"
            >
              <LinkedinIcon className="h-4 w-4" />
              Doğukan Taha Tıraş
            </a>
            <a
              href="https://github.com/dodovlski"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-dark hover:text-white transition-colors"
            >
              <GithubIcon className="h-4 w-4" />
              github.com/dodovlski
            </a>
          </div>
        </section>

        {/* Stack */}
        <section className="space-y-4">
          <div className="h-1 w-10 bg-brand-red" />
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark">Kullandığım Stack</h2>
          <p className="text-sm text-brand-muted">
            Projede kullanılan temel kütüphaneler ve teknolojiler:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STACK_ITEMS.map((item) => (
              <li key={item.title} className="rounded-sm border border-brand-border bg-white p-4 shadow-sm flex items-center">
                <div className="text-sm font-semibold text-brand-dark">{item.title}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* Beklentiler */}
        <section className="space-y-4">
          <div className="h-1 w-10 bg-brand-red" />
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark">
            Beklentileri Nasıl Karşıladım?
          </h2>
          <ul className="space-y-3">
            {EXPECTATIONS.map((e) => (
              <li key={e.title} className="rounded-sm border border-brand-border bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-semibold text-brand-dark">{e.title}</h3>
                    <p className="text-sm leading-relaxed text-brand-muted">{e.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Sorular */}
        <section className="space-y-4">
          <div className="h-1 w-10 bg-brand-red" />
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark">
            Neyi Neden Yaptım?
          </h2>
          <p className="text-sm text-brand-muted">
            Brief'te her adayın düşünmesi istenen 8 soru vardı. İşte benim cevaplarım.
          </p>
          <ol className="space-y-3">
            {QUESTIONS.map((q, idx) => (
              <li key={q.q} className="rounded-sm border border-brand-border bg-white shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-brand-red" />
                <div className="p-5 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-brand-dark">{q.q}</h3>
                  </div>
                  <p className="pl-7 text-sm leading-relaxed text-brand-muted">{q.answer}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Kapsam dışı */}
        <section className="space-y-4">
          <div className="h-1 w-10 bg-brand-red" />
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark">Bilinçli Kapsam Dışı</h2>
          <p className="text-sm text-brand-muted">
            48 saatlik bir pencerede her şeyi yapamazsın. Şunları bilinçli olarak erteledim:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OUT_OF_SCOPE.map((s) => (
              <li key={s} className="rounded-sm border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-dark">
                {s}
              </li>
            ))}
          </ul>
        </section>

      </main>
    </>
  );
}

const STACK_ITEMS = [
  { title: "Next.js 16 + React 19" },
  { title: "TypeScript 5" },
  { title: "Prisma 7 + libSQL (Turso)" },
  { title: "Tailwind CSS v4" },
  { title: "@dnd-kit/core + sortable" },
  { title: "fractional-indexing (LexoRank)" },
  { title: "jose + bcryptjs (custom JWT)" },
  { title: "Lucide React + sonner" },
  { title: "zod + Geist Typography" },
];

const EXPECTATIONS = [
  {
    title: "Hesap oluşturma ve giriş",
    body: "E-posta + şifre (min 8 karakter) ile kayıt yaptım. Şifreyi bcrypt ile hash'leyip DB'ye kaydediyorum; başarılı girişte jose ile imzalı JWT cookie yazıyorum.",
  },
  {
    title: "Board, sütun ve kart yönetimi",
    body: "Hepsini ayrı server actions olarak yazdım. Her işlem optimistic UI ile anında yansıyor; sunucu hatası olursa önceki state'e rollback yapıyorum.",
  },
  {
    title: "Sürükle-bırak ile kart taşıma",
    body: "onDragOver'da kartı anında görsel olarak hedefe taşıyorum. onDragEnd'de yeni sıralamayı hesaplayıp sunucuya yazıyorum. Sürüklenen kart DragOverlay ile gölge + hafif rotasyonla görünüyor.",
  },
  {
    title: "Kart detayları düzenleme",
    body: "Karta tıklayınca açılan modalda başlık, açıklama, öncelik, son teslim tarihi, etiket ve yorumları düzenleyebiliyorum. Sadece gerçek değişiklik varsa kayıt butonu aktif oluyor.",
  },
  {
    title: "Sıralama sayfa yenilemesinde korunuyor",
    body: "Her kartın ve sütunun bir order string'i var (fractional index). Sayfa yenilendiğinde Prisma order ASC ile getiriyor; kullanıcı tam bıraktığı sıralamayı görüyor.",
  },
  {
    title: "Vercel'da çalışır durumda",
    body: "@prisma/adapter-libsql ile Turso'ya bağlanıyorum. Kod hiç değişmiyor; sadece DATABASE_URL ve AUTH_SECRET env değişkenleri Vercel'e ekleniyor.",
  },
];

const QUESTIONS = [
  {
    q: "Hangi sürükle-bırak kütüphanesini seçtim ve neden?",
    answer:
      "@dnd-kit seçtim. react-beautiful-dnd artık bakım almıyor. Tarayıcı yerleşik HTML5 DnD'nin mobil desteği zayıf; SortableJS'in React entegrasyonu imperatif ve zahmetli. dnd-kit modern, aktif olarak geliştirilmeye devam ediyor, tree-shakeable (~10KB gzip), mobil touch ve klavye navigasyonu built-in geliyor.",
  },
  {
    q: "Sıralama verisini nasıl sakladım?",
    answer:
      "Klasik 1-2-3 integer sırası yerine fractional indexing kullandım. Kart taşıdığımda sadece o kartı güncelliyorum — tüm listeyi yeniden numaralandırmıyorum. Sayfa yenilenince Prisma aynı order ASC sorgusunu çekiyor, sıralama aynen korunuyor. Trade-off: order alanı string, biraz daha yer kaplıyor ama yazma maliyeti O(1) sabit.",
  },
  {
    q: "Mobilede sürükle-bırak nasıl çalışıyor?",
    answer:
      "TouchSensor'u 200ms uzun-basma + 8px tolerans ile kurdum. Bu sayede kullanıcı sayfada aşağı kaydırırken yanlışlıkla kart kaldırmıyor. Drag handle'lar touch-none CSS ile işaretlendi, tarayıcı kendi gesture'larını devreye almıyor. Klavye sensörü de aktif; Tab+Space ile kart kaldırıp yön tuşlarıyla taşıyabiliyorsun.",
  },
  {
    q: "Sütunların sırası da değiştirilebilir mi?",
    answer:
      "Evet, sütunlar da sortable. Sütun başlığındaki grip handle'ı ile sürüklenebiliyor. Aynı fractional indexing sistemi kullandım; moveColumn server action'ı tek satır UPDATE yapıyor. closestCorners + data.type kontrolüyle kart ile sütunun birbirine karışmasını engelledim.",
  },
  {
    q: "Etiket, son teslim tarihi ve sorumlu kişi — hangisini ekledim?",
    answer:
      "Üçünü de ekledim. Etiket (board seviyesinde Label CRUD + karta toggle), son teslim tarihi (date input + renk kodlu badge), öncelik (none/low/medium/high) ve assignee (board üyelerinden seçilen sorumlu kişi dropdown'u). Assignee değişikliği activity log'a da düşüyor.",
  },
  {
    q: "Board paylaşımını nasıl kurdum?",
    answer:
      "E-posta ile davet gönderebiliyorum. Üç rol var: OWNER, EDITOR, VIEWER. Henüz kayıtlı olmayan davetliler BoardInvite tablosuna düşüyor; o kişi kayıt olunca otomatik üye yapılıyor. Yetkilendirmeyi sadece UI'da değil, her server action'da da kontrol ediyorum — VIEWER olmak kullanıcının API'ye doğrudan istek atmasını da engelliyor.",
  },
  {
    q: "Aktivite geçmişi ekledim mi?",
    answer:
      "Evet. ActivityLog tablosu + logActivity() helper'ı ile 9 farklı event tipini (card_created, card_moved, title_changed, description_changed, priority_changed, due_date_changed, assignee_changed, label_added, label_removed) kaydediyorum. Kart detay modalında 'Activity' sekmesinde timeline olarak gösteriyorum — kim, ne zaman, ne yaptı sorusuna tam cevap veriyor.",
  },
  {
    q: "Çok kart olduğunda performans nasıl?",
    answer:
      "Optimistic UI sayesinde kullanıcı sürüklemeyi bırakır bırakmaz kart hedefe oturur — server roundtrip arka planda gerçekleşiyor. Fractional indexing tek satır UPDATE yaptığı için DB tarafı da sabit zamanlı. Binlerce kart için React render maliyeti artar; bu durumda virtualization gerekir ama mevcut kapsam için aşırı mühendislik olurdu.",
  },
];

const OUT_OF_SCOPE = [
  "Real-time collab (WebSocket / Liveblocks)",
  "Kart resim / dosya eki",
  "Virtualized rendering (10K+ kart)",
];
