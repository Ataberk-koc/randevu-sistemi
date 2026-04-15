import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Veritabanı tohumlanıyor...')

  // 1. Şifreyi hashle (Şifre: 123123)
  const hashedPassword = await bcrypt.hash('123123', 10)
  
  // 2. Admin Kullanıcısını Oluştur
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      email: 'admin@admin.com',
      name: 'Süper Admin',
      phone: '5554443322',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log(`👤 Admin oluşturuldu: ${admin.email}`)

  // 3. Örnek Hizmetleri Ekle
  const servicesData = [
    { name: 'Saç Kesimi', duration: 45, price: 500, bufferTime: 15 },
    { name: 'Sakal Tıraşı', duration: 30, price: 300, bufferTime: 10 },
    { name: 'Cilt Bakımı', duration: 60, price: 1200, bufferTime: 20 },
    { name: 'Komple Masaj', duration: 90, price: 2500, bufferTime: 30 },
  ]

  // Varsa atla, yoksa oluştur (duplicate hatasını önle)
  for (const s of servicesData) {
    const existing = await prisma.service.findFirst({
      where: { name: s.name }
    });
    if (!existing) {
      await prisma.service.create({ 
        data: {
          ...s,
          price: s.price
        }
      })
    }
  }
  console.log('✂️  Hizmetler eklendi.')

  // 4. Ürünleri Ekle
  const productsData = [
    { name: 'Profesyonel Şampuan', price: 450, taxRate: 20, stock: 50 },
    { name: 'Keratin Bakım Yağı', price: 800, taxRate: 20, stock: 20 },
  ]

  // Varsa atla, yoksa oluştur (duplicate hatasını önle)
  for (const p of productsData) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name }
    });
    if (!existing) {
      await prisma.product.create({ 
        data: {
          ...p,
          price: p.price
        }
      })
    }
  }
  console.log('🛍️  Ürünler eklendi.')

  // 5. Varsayılan çalışma günleri oluştur (0=Pazar, 1=Pazartesi ... 6=Cumartesi)
  console.log('📅 Varsayılan çalışma günleri oluşturuluyor...');
  for (let i = 0; i <= 6; i++) {
    await prisma.workingDay.upsert({
      where: { dayOfWeek: i },
      update: {}, // Varsa dokunma (Adminin ayarını bozma)
      create: {
        dayOfWeek: i,
        startTime: "09:00", // Varsayılan başlangıç
        endTime: "18:00",   // Varsayılan bitiş
        isClosed: i === 0,  // Sadece Pazar (0) kapalı gelsin
      },
    });
  }
  console.log('✅ Çalışma günleri tablosu hazır.');

  console.log('✅ Seed işlemi tamamlandı!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })