import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { generateKeyBetween } from "fractional-indexing";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "demo@kocsprint.local";
  const passwordHash = await bcrypt.hash("demo12345", 10);

  await prisma.user.deleteMany({ where: { email } });
  const user = await prisma.user.create({
    data: { email, passwordHash, name: "Demo" },
  });

  const o1 = generateKeyBetween(null, null);
  const o2 = generateKeyBetween(o1, null);
  const o3 = generateKeyBetween(o2, null);

  const board = await prisma.board.create({
    data: {
      title: "Demo Sprint",
      ownerId: user.id,
      columns: {
        create: [
          {
            title: "Yapılacak",
            order: o1,
            cards: {
              create: [
                { title: "Kullanıcı login akışı", order: generateKeyBetween(null, null) },
                {
                  title: "Board CRUD",
                  description: "Oluştur, sil, listele.",
                  order: generateKeyBetween("a0", null),
                },
              ],
            },
          },
          {
            title: "Devam Ediyor",
            order: o2,
            cards: {
              create: [
                { title: "Sürükle-bırak entegrasyonu", order: generateKeyBetween(null, null) },
              ],
            },
          },
          {
            title: "Tamamlandı",
            order: o3,
            cards: {
              create: [
                { title: "Proje iskeleti", order: generateKeyBetween(null, null) },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Seed tamam. User: ${email} / demo12345 · Board: ${board.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
