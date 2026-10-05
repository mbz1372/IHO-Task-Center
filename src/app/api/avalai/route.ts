import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.AVALAI_API_KEY;
    const model = process.env.AVALAI_MODEL || 'gpt-4o-mini';
    const baseUrl = (process.env.AVALAI_BASE_URL || 'https://api.avalai.ir/v1').replace(/\/$/, '');

    if (!apiKey) {
      return NextResponse.json({
        text: 'کلید AVALAI_API_KEY در Vercel تنظیم نشده است. بعد از تنظیم کلید، همین درخواست تحلیل مدیریتی واقعی تولید می‌کند.'
      });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 1,
        messages: [
          { role: 'system', content: 'تو دستیار تحلیل عملیات و رزرو ایران‌هتل هستی. پاسخ فارسی، اجرایی، کوتاه و مبتنی بر اقدام بده.' },
          { role: 'user', content: String(prompt || '') }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ text: `Aval AI خطا داد: ${response.status}\n${detail.slice(0, 800)}` }, { status: 200 });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || data?.text || 'پاسخی از مدل دریافت نشد.';
    return NextResponse.json({ text });
  } catch (error: any) {
    return NextResponse.json({ text: `خطا در API داخلی Aval AI: ${error?.message || String(error)}` }, { status: 200 });
  }
}
