require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Prisma 6+ için en sade ve stabil başlatma
const prisma = new PrismaClient();

const app = express();
const PORT = 3000;

// Middleware ayarları
app.use(cors());
app.use(express.json());

// 1. TEST ROTASI (Sunucu çalışıyor mu?)
app.get('/', (req, res) => {
  res.send('Sunucu canavar gibi çalışıyor! 🚀');
});

// 2. KAYIT ROTASI (Kullanıcıyı veritabanına ekler)
app.post('/register', async (req, res) => {
  const { displayName, username, email, password } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        displayName,
        username,
        email,
        password, // Not: Sunumdan sonra bunu 'bcrypt' ile şifrelemeyi ekleyebiliriz.
        provider: "LOCAL"
      },
    });

    console.log("✅ Yeni kullanıcı kaydedildi:", newUser.username);
    res.status(201).json({ 
      message: "Başarıyla kayıt olundu!", 
      user: { id: newUser.id, username: newUser.username } 
    });
    
  } catch (error) {
    console.error("❌ Kayıt hatası:", error.message);
    res.status(400).json({ 
      error: "Kayıt sırasında bir hata oluştu. (Bu kullanıcı adı veya e-posta alınmış olabilir)" 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde yayında.`);
});