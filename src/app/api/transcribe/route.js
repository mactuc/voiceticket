import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const fallbackUrl = isDev ? 'http://127.0.0.1:8000' : 'http://backend:8000';
    const backendUrl = process.env.BACKEND_URL || fallbackUrl;

    // Use Next.js built-in API routing to parse the multipart data safely
    const formData = await request.formData();
    
    console.log(`[Next.js Proxy] Route Handler sending to: ${backendUrl}/transcribe`);

    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Next.js Proxy] Backend returned an error: ${response.status}`, errorText);
      return NextResponse.json(
        { error: "Backend transcription failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Next.js Proxy] Internal App Router Exception:", err);
    return NextResponse.json(
      { error: "Internal Proxy Error", details: String(err) },
      { status: 500 }
    );
  }
}
