import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user.email !== 'kakobuybs209@gmail.com') {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Nie przesłano pliku' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    
    // Upewnij się, że katalog istnieje
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'qc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/qc/${filename}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('Błąd wgrywania pliku:', error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas wgrywania pliku' }, { status: 500 });
  }
}
