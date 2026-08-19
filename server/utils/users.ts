import { scryptSync, timingSafeEqual } from 'node:crypto'

type UserRole = 'demo' | 'user' | 'admin'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  workspace: string
}

type Account = AuthUser & {
  passwordHash: string
}

const accounts: Account[] = [
  {
    id: 'usr_demo',
    name: 'Demo Operator',
    email: 'demo@listen.direct',
    role: 'demo',
    workspace: 'Demo Sandbox',
    passwordHash: '45342d9ad7cc091427fae40f5b0a115f:011987d6558a61ed5c3bb105dc3edb2604b08ccc1e751188acfd990513981ffd43a570802c77d37b5d371cb6dc4d2564fba5fb3c9677b035b17ee257fad65b02',
  },
  {
    id: 'usr_member',
    name: 'Product Operator',
    email: 'user@listen.direct',
    role: 'user',
    workspace: 'Production',
    passwordHash: 'af131a66a642a35d25cb2f3fdc780b4f:6959d4c5060a9ab615689c28854e3a84f8061fd35dc2dfa0bebcf2637341845893867777341355a633cd4dec147ec98a0ed3439b3f8977fe1535761fbfb41bb8',
  },
  {
    id: 'usr_admin',
    name: 'Platform Admin',
    email: 'admin@listen.direct',
    role: 'admin',
    workspace: 'All Workspaces',
    passwordHash: '43445cb6cd2044cc77b14e485176c74f:9ff3b3cb4571e65ab927a124991156d4842226512f00ef1ceff156facf2b2ec1c174a64036d08d9c638acd593282aa93f5a444963696f1358e20b83752eb7fb5',
  },
]

function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(':')
  if (!salt || !expectedHex) return false

  const expected = Buffer.from(expectedHex, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return timingSafeEqual(expected, actual)
}

export function verifyCredentials(email: string, password: string): AuthUser | null {
  const account = accounts.find(item => item.email === email.trim().toLowerCase())
  if (!account || !verifyPassword(password, account.passwordHash)) return null

  const { passwordHash: _, ...user } = account
  return user
}

export function listUsers(): AuthUser[] {
  return accounts.map(({ passwordHash: _, ...user }) => user)
}
