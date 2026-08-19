import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const ignoredDirectories = new Set([
  '.git', '.nuxt', '.output', '.nitro', '.data', 'node_modules',
  'coverage', 'dist', 'outputs', 'work',
])
const blockedExtensions = new Set(['.key', '.pem', '.p12', '.pfx'])
const blockedNames = [/^\.env(?:\..+)?$/, /^credentials.*\.json$/i, /^service-account.*\.json$/i]
const allowedNames = new Set(['.env.example'])
const findings = []

const contentPatterns = [
  ['private key', new RegExp(['BEGIN', '(?:RSA |EC |OPENSSH )?', 'PRIVATE KEY'].join(' '))],
  ['AWS access key', new RegExp('AK' + 'IA[0-9A-Z]{16}')],
  ['GitHub token', new RegExp('gh' + '[pousr]_[A-Za-z0-9]{36,255}')],
  ['API secret', new RegExp('sk-' + '(?:proj-)?[A-Za-z0-9_-]{24,}')],
]

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue

    const absolutePath = join(directory, entry.name)
    const projectPath = relative(root, absolutePath)

    if (entry.isDirectory()) {
      visit(absolutePath)
      continue
    }

    if (!entry.isFile()) continue

    const fileName = basename(entry.name)
    const isBlockedName = blockedNames.some(pattern => pattern.test(fileName))
    if (!allowedNames.has(fileName) && (isBlockedName || blockedExtensions.has(extname(fileName)))) {
      findings.push(`${projectPath}: sensitive filename should not be committed`)
      continue
    }

    if (projectPath === 'scripts/security-check.mjs' || statSync(absolutePath).size > 1_000_000) continue

    const contents = readFileSync(absolutePath)
    if (contents.includes(0)) continue

    const text = contents.toString('utf8')
    for (const [label, pattern] of contentPatterns) {
      if (pattern.test(text)) findings.push(`${projectPath}: possible ${label}`)
    }
  }
}

visit(root)

const ignoreFile = readFileSync(join(root, '.gitignore'), 'utf8')
const requiredIgnores = ['.env', '.env.*', 'secrets/', '*.key', '*.pem', 'node_modules/', '.output/']
for (const rule of requiredIgnores) {
  if (!ignoreFile.split(/\r?\n/).includes(rule)) findings.push(`.gitignore: missing ${rule}`)
}

if (findings.length) {
  console.error('Security check failed:')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exitCode = 1
} else {
  console.log('Security check passed: no high-confidence secret files or tokens detected.')
}
