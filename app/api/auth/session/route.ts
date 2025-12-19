import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        email: session.user?.email,
        name: session.user?.name,
      }
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}