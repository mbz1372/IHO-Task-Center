import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    const apiKey = process.env.AVALAI_API_KEY;
    const model = process.env.AVALAI_MODEL || 'gpt-4o-mini';
    const baseUrl = process.env.AVALAI_BASE_URL || 'https://api.avalai.ir/v1/chat/completions';

    if (!apiKey) {
      return NextResponse.json({
        ok: false,
        answer: 'کلید Aval AI در Vercel تنظیم نشده است. متغیر AVALAI_API_KEY را اضافه کنید.',
      });
    }

    const system = `You are an operations intelligence assistant for IranHotelOnline supply chain. Answer in Persian. Be practical and concise. Focus on reservation conversion, lost bookings, supply tasks, hotel risk, rate/capacity, and team execution.`;

    const r = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 1,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Context JSON:\n${JSON.stringify(context || {}).slice(0,12000)}\n\nQuestion:\n${message}` }
        ]
      })
    });
    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content || data?.message || 'پاسخی از Aval AI دریافت نشد.';
    return NextResponse.json({ ok: true, answer });
  } catch (e:any) {
    return NextResponse.json({ ok:false, answer: e?.message || 'خطای ناشناخته در Aval AI' }, { status: 200 });
  }
}
