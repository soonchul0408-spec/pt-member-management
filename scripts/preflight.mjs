/* global console, process, URL */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fileEnvironment = loadEnvironmentFiles()
const failures = []
const warnings = []

function loadEnvironmentFiles() {
  const values = {}
  const files = ['.env', '.env.local']

  for (const file of files) {
    const path = join(projectRoot, file)
    if (!existsSync(path)) continue

    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) continue
      const rawValue = match[2].trim()
      values[match[1]] = rawValue.replace(/^("|')|("|')$/g, '')
    }
  }

  return values
}

function envValue(name) {
  return Object.prototype.hasOwnProperty.call(process.env, name) ? process.env[name] : fileEnvironment[name]
}

function pass(message) {
  console.log(`PASS ${message}`)
}

function warn(message) {
  warnings.push(message)
  console.log(`WARN ${message}`)
}

function fail(message) {
  failures.push(message)
  console.log(`FAIL ${message}`)
}

function hasValue(name) {
  return typeof envValue(name) === 'string' && envValue(name).trim().length > 0
}

function checkEnv(name, { required = false } = {}) {
  if (hasValue(name)) {
    pass(`환경변수 ${name} 존재`)
    return true
  }

  if (required) fail(`환경변수 ${name} 필요`)
  else warn(`환경변수 ${name} 미설정`)
  return false
}

function checkUrl(name, { required = false, httpsInProduction = false } = {}) {
  if (!checkEnv(name, { required })) return false

  try {
    const value = new URL(envValue(name))
    if (!['http:', 'https:'].includes(value.protocol)) throw new Error('unsupported protocol')
    if (httpsInProduction && value.protocol !== 'https:') {
      fail(`${name} 운영 URL은 HTTPS여야 함`)
      return false
    }
    pass(`${name} URL 형식 확인`)
    return true
  } catch {
    fail(`${name} URL 형식 오류`)
    return false
  }
}

function checkPositiveInteger(name, { required = false } = {}) {
  if (!checkEnv(name, { required })) return false
  const value = Number.parseInt(envValue(name), 10)
  if (!Number.isInteger(value) || value < 1) {
    fail(`${name} 양의 정수 필요`)
    return false
  }
  pass(`${name} 숫자 형식 확인`)
  return true
}

function checkFiles() {
  const requiredFiles = [
    'api/_lib/ptServer.js',
    'api/v1/consultations.js',
    'api/v1/consultations/[id].js',
    'api/v1/consultations/[id]/convert.js',
    'supabase/migrations/20260814_pt_consultations.sql',
    'docs/pt-data-api.md',
    'docs/operations-checklist.md',
    '.env.example',
  ]

  for (const file of requiredFiles) {
    if (existsSync(join(projectRoot, file))) pass(`필수 파일 존재: ${file}`)
    else fail(`필수 파일 없음: ${file}`)
  }
}

function checkDocumentedEnvironmentNames() {
  const examplePath = join(projectRoot, '.env.example')
  if (!existsSync(examplePath)) return

  const documented = new Set(
    readFileSync(examplePath, 'utf8')
      .match(/^[A-Z][A-Z0-9_]*(?==)/gm) || [],
  )
  const sourceFiles = [...readTextFiles(join(projectRoot, 'src')), ...readTextFiles(join(projectRoot, 'api'))]
  const used = new Set()
  const pattern = /(?:import\.meta\.env|process\.env)\.([A-Z][A-Z0-9_]*)/g
  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(pattern)) used.add(match[1])
  }

  const automatic = new Set(['BASE_URL', 'DEV', 'PROD', 'NODE_ENV', 'VERCEL'])
  const missing = [...used].filter((name) => !automatic.has(name) && !documented.has(name))
  if (missing.length) fail('코드에서 사용하는 환경변수 중 .env.example에 없는 이름이 있음')
  else pass('코드의 환경변수 이름이 .env.example에 문서화됨')
}

function readTextFiles(root) {
  if (!existsSync(root)) return []
  const entries = readdirSync(root, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) files.push(...readTextFiles(fullPath))
    else if (entry.isFile()) files.push(fullPath)
  }

  return files
}

function checkClientSecretExposure() {
  const clientRoot = join(projectRoot, 'src')
  const clientFiles = readTextFiles(clientRoot)
  const clientSecretPattern = /SUPABASE_SERVICE_ROLE_KEY|service_role/i
  const clientSecretFiles = clientFiles.filter((file) => clientSecretPattern.test(readFileSync(file, 'utf8')))

  if (clientSecretFiles.length) {
    fail('서비스 role 키 이름 또는 role 토큰이 src에 포함됨')
  } else {
    pass('서비스 role 키가 src에 포함되지 않음')
  }

  const distRoot = join(projectRoot, 'dist')
  if (!existsSync(distRoot)) {
    warn('dist가 없어 빌드 산출물 비밀값 검사를 건너뜀')
    return
  }

  const distFiles = readTextFiles(distRoot)
  const leakedFiles = distFiles.filter((file) => {
    const content = readFileSync(file, 'utf8')
    return /SUPABASE_SERVICE_ROLE_KEY|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i.test(content)
  })

  if (leakedFiles.length) fail('빌드 산출물에서 서버 비밀값 패턴 발견')
  else pass('빌드 산출물에 서버 비밀값 패턴 없음')
}

function checkTrackedSensitiveFiles() {
  let tracked
  try {
    tracked = execFileSync('git', ['ls-files'], { cwd: projectRoot, encoding: 'utf8' })
  } catch {
    warn('Git 추적 파일 검사를 실행하지 못함')
    return
  }

  const sensitiveFiles = tracked
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => /^\.env(?:\.|$)/.test(file) && file !== '.env.example' || /\.(?:pem|key)$/i.test(file))

  if (sensitiveFiles.length) fail('비밀값 파일이 Git 추적 대상임')
  else pass('비밀값 파일이 Git 추적 대상이 아님')
}

function checkEnvironment() {
  const mode = envValue('VITE_PT_DATA_MODE')?.trim().toLowerCase() || ''
  const production = envValue('NODE_ENV') === 'production' || envValue('VERCEL') === '1' || mode === 'api'

  if (mode && !['api', 'local'].includes(mode)) fail('VITE_PT_DATA_MODE는 api 또는 local이어야 함')
  else pass(`저장 모드 확인: ${production ? '운영/API' : '개발/localStorage'}`)

  checkUrl('VITE_SUPABASE_URL', { required: production, httpsInProduction: production })
  const hasPublishableKey = hasValue('VITE_SUPABASE_PUBLISHABLE_KEY')
  const hasAnonKey = hasValue('VITE_SUPABASE_ANON_KEY')
  if (hasPublishableKey || hasAnonKey) pass('Supabase 클라이언트 키 존재')
  else if (production) fail('VITE_SUPABASE_PUBLISHABLE_KEY 또는 VITE_SUPABASE_ANON_KEY 필요')
  else warn('Supabase 클라이언트 키 미설정: 개발 localStorage 모드로 동작')

  if (production) {
    checkEnv('SUPABASE_SERVICE_ROLE_KEY', { required: true })
    checkEnv('PT_PRIVACY_POLICY_VERSION', { required: true })
    checkPositiveInteger('PT_CONSULTATION_RETENTION_DAYS', { required: true })
    checkPositiveInteger('PT_PUBLIC_RATE_LIMIT', { required: true })
    checkPositiveInteger('PT_PUBLIC_RATE_WINDOW_SECONDS', { required: true })
    checkEnv('PT_RATE_LIMIT_SALT', { required: true })
    if (envValue('PT_ALLOW_UNRATED_PUBLIC_CONSULTATIONS') === 'true') {
      fail('운영 환경에서 PT_ALLOW_UNRATED_PUBLIC_CONSULTATIONS=true는 허용하지 않음')
    } else {
      pass('운영 공개 상담 rate limit 우회 설정 비활성화')
    }
  } else {
    for (const name of [
      'SUPABASE_SERVICE_ROLE_KEY',
      'PT_PRIVACY_POLICY_VERSION',
      'PT_CONSULTATION_RETENTION_DAYS',
      'PT_PUBLIC_RATE_LIMIT',
      'PT_PUBLIC_RATE_WINDOW_SECONDS',
      'PT_RATE_LIMIT_SALT',
    ]) checkEnv(name)
  }

  if (hasValue('VITE_PT_API_BASE_URL')) {
    const baseUrl = envValue('VITE_PT_API_BASE_URL').trim()
    if (!baseUrl.startsWith('/') && !/^https?:\/\//i.test(baseUrl)) fail('VITE_PT_API_BASE_URL 형식 오류')
    else if (/^https?:\/\//i.test(baseUrl)) warn('절대 API URL은 현재 same-origin CORS 정책 범위 밖이므로 별도 검토 필요')
    else pass('VITE_PT_API_BASE_URL 형식 확인')
  } else warn('VITE_PT_API_BASE_URL 미설정: 기본 /api/v1 사용')

  if (envValue('VITE_LOCAL_EDITOR_MODE') === 'true' && production) {
    warn('운영 환경의 VITE_LOCAL_EDITOR_MODE=true는 코드에서 비활성화되지만 설정을 제거하는 것이 안전함')
  }
}

console.log('PT 회원관리 운영 전 사전 점검')
checkEnvironment()
checkFiles()
checkDocumentedEnvironmentNames()
checkClientSecretExposure()
checkTrackedSensitiveFiles()

console.log(`결과: 실패 ${failures.length}건, 경고 ${warnings.length}건`)
if (failures.length) process.exitCode = 1
