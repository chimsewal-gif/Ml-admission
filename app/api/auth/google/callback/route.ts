import { NextRequest, NextResponse } from 'next/server';

interface GoogleTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

interface BackendResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
      }),
    });

    const tokens: GoogleTokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokens as any);
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const googleUser: GoogleUser = await userResponse.json();

    // Send user data to your backend to create/login user
    const backendResponse = await fetch('http://127.0.0.1:8000/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        google_id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        access_token: tokens.access_token,
      }),
    });

    const backendData: BackendResponse = await backendResponse.json();

    if (!backendResponse.ok) {
      throw new Error((backendData as any).error || 'Backend authentication failed');
    }

    // Redirect to frontend with tokens
    const redirectUrl = new URL('/api/auth/google/redirect', request.url);
    redirectUrl.searchParams.set('token', backendData.token);
    redirectUrl.searchParams.set('user', JSON.stringify(backendData.user));

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }
}