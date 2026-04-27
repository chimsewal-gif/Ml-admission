import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const user = searchParams.get('user');

    if (!token || !user) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    // Create response and set cookies
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set token cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Set user cookie
    response.cookies.set('user', user, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google auth redirect error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}