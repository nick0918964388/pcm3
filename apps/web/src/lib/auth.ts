import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { userRepository } from "../repositories/userRepository"

// Validate JWT secret in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production')
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const user = await userRepository.findByUsername(credentials.username as string)
          
          if (!user) {
            return null
          }

          const isValidPassword = await userRepository.validatePassword(
            credentials.password as string, 
            user.hashedPassword
          )

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id.toString(),
            username: user.username,
            name: user.fullName,
            email: user.email
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.username = token.username as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
})