/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pcm/shared'],
  output: 'standalone',
  experimental: {
    appDir: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'hooks'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }
}

module.exports = nextConfig