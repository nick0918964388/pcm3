import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'

// Simple rate limiting cache (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const limit = 100 // requests per window
  
  const current = rateLimitMap.get(ip)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  if (current.count >= limit) {
    return true
  }
  
  current.count++
  return false
}

export async function GET(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  if (rateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No active session' }, 
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        name: session.user.name,
        email: session.user.email
      },
      expires: session.expires
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}