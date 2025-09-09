/**
 * Docker Environment Validation Tests
 * These tests validate that Docker configuration files are properly set up
 */

const fs = require('fs')
const path = require('path')

describe('Docker Configuration Validation', () => {
  const rootDir = path.resolve(__dirname, '..')

  it('should have docker-compose.yml file', () => {
    const dockerComposePath = path.join(rootDir, 'docker-compose.yml')
    expect(fs.existsSync(dockerComposePath)).toBe(true)
  })

  it('should have .env.example file', () => {
    const envExamplePath = path.join(rootDir, '.env.example')
    expect(fs.existsSync(envExamplePath)).toBe(true)
  })

  it('should have Dockerfile for web app', () => {
    const dockerfilePath = path.join(rootDir, 'apps', 'web', 'Dockerfile')
    expect(fs.existsSync(dockerfilePath)).toBe(true)
  })

  it('should have Oracle initialization scripts', () => {
    const oracleInitPath = path.join(rootDir, 'infrastructure', 'oracle', 'init', '01-create-user.sql')
    expect(fs.existsSync(oracleInitPath)).toBe(true)
  })

  it('docker-compose.yml should define required services', () => {
    const dockerComposePath = path.join(rootDir, 'docker-compose.yml')
    const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8')
    
    expect(dockerComposeContent).toContain('web:')
    expect(dockerComposeContent).toContain('oracle:')
    expect(dockerComposeContent).toContain('3000:3000')
    expect(dockerComposeContent).toContain('1521:1521')
  })

  it('.env.example should contain required environment variables', () => {
    const envExamplePath = path.join(rootDir, '.env.example')
    const envContent = fs.readFileSync(envExamplePath, 'utf8')
    
    expect(envContent).toContain('DATABASE_URL=')
    expect(envContent).toContain('DATABASE_SCHEMA=')
    expect(envContent).toContain('NEXTAUTH_URL=')
    expect(envContent).toContain('NEXTAUTH_SECRET=')
    expect(envContent).toContain('ORACLE_PWD=')
  })
})