/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pcm/shared'],
  output: 'standalone',
  experimental: {
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
}

module.exports = nextConfig