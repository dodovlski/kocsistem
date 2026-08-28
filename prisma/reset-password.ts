import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const email = process.argv[2] || "dogukantt27@gmail.com";
const newPassword = process.argv[3] || "koc12345!";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("HATA: .env dosyasında DATABASE_URL bulunamadı.");
    console.error("Lütfen .env dosyasına DATABASE_URL ekleyin veya komutla verin: DATABASE_URL=\"...\" npx tsx prisma/reset-password.ts");
    process.exit(1);
  }

  console.log(`Bağlantı kuruluyor...`);
  const adapter = new PrismaNeon({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  console.log(`Kullanıcı aranıyor: ${email}`);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`Kullanıcı bulunamadı: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log(`\n========================================`);
  console.log(`✓ Şifre başarıyla güncellendi!`);
  console.log(`E-posta     : ${email}`);
  console.log(`Yeni Şifre  : ${newPassword}`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Hata oluştu:", err);
  process.exit(1);
});
