// app/api/env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    // otherVar: process.env.NEXT_PUBLIC_OTHER_VAR
  });
}