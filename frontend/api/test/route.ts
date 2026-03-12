import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'test route',
    ok: true,
  });
}

export async function POST(request: Request) {
  let body: any = null;
  try {
    body = await request.json();
  } catch (err) {
    // ignore parse errors, return null
  }

  return NextResponse.json({
    message: 'test route POST',
    ok: true,
    received: body,
  });
}
