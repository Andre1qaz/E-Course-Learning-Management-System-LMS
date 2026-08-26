import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  return handleProxy(request);
}

export async function POST(request: NextRequest) {
  return handleProxy(request);
}

export async function PUT(request: NextRequest) {
  return handleProxy(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      console.error('Missing endpoint parameter');
      return NextResponse.json(
        { success: false, data: null, message: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }

    const targetUrl = `${API_URL}${endpoint}`;
    const method = request.method;
    
    console.log(`=== PROXY DEBUG ===`);
    console.log(`Proxying ${method} request to: ${targetUrl}`);
    console.log(`API_URL configured as: ${API_URL}`);
    console.log(`Full request URL: ${request.url}`);

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Handle body for non-GET requests
    let body = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      try {
        body = await request.json();
        console.log(`Request body:`, body);
      } catch (e) {
        console.log('No body or invalid JSON in request');
      }
    }

    console.log(`Proxy request details:`, { method, targetUrl, hasAuth: !!authHeader, hasBody: !!body });

    let response;
    try {
      response = await fetch(targetUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (fetchError) {
      console.error('Failed to connect to backend:', fetchError);
      return NextResponse.json(
        { success: false, data: null, message: `Tidak dapat terhubung ke backend di ${API_URL}. Pastikan backend berjalan.` },
        { status: 503 }
      );
    }

    const responseText = await response.text();
    console.log(`Backend response status: ${response.status}`);
    console.log(`Backend response preview:`, responseText.substring(0, 300));
    
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // If response is not JSON, it's likely an error page from the backend
      console.error('Backend returned non-JSON response:', responseText.substring(0, 200));
      console.error('Full backend response:', responseText);
      return NextResponse.json(
        { success: false, data: null, message: 'Backend server error atau tidak tersedia. Periksa apakah backend berjalan pada port 3001.' },
        { status: response.status }
      );
    }
    
    console.log(`Proxy response status: ${response.status}`, data);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, data: null, message: 'Terjadi kesalahan pada proxy', error: String(error) },
      { status: 500 }
    );
  }
}