import {afterEach, describe, expect, it} from 'vitest'
import {openDatabase, type AppDb} from '../../src/main/db/client'
import {createGoogleAuth} from '../../src/main/sync/googleAuth'
import type {SettingsService} from '../../src/main/services/settingsService'

function settingsStub(): SettingsService {
  const store = new Map<string, string>()
  return {
    getRaw: (key: string) => store.get(key) ?? null,
    setRaw: (key: string, value: string) => void store.set(key, value),
    deleteRaw: (key: string) => void store.delete(key),
    getAll: () => ({}) as never,
    set: () => ({}) as never
  } as SettingsService
}

describe('googleAuth web flow', () => {
  let db: AppDb | null = null
  let sqlite: {close: () => void} | null = null

  afterEach(() => {
    sqlite?.close()
    sqlite = null
    db = null
  })

  it('keeps credentials in the Settings-backed flow and returns a PKCE authorization URL', async () => {
    const opened = openDatabase(':memory:')
    db = opened.db
    sqlite = opened.sqlite
    const auth = createGoogleAuth(db, settingsStub(), {redirectUri: 'https://calendar.example.com/api/google/oauth/callback'})

    auth.setCredentials('client-id-1234567890', 'client-secret')
    expect(auth.isConfigured()).toBe(true)

    const result = await auth.connect()
    expect(result.email).toBe('')
    expect(result.authUrl).toContain('client_id=client-id-1234567890')
    expect(result.authUrl).toContain('redirect_uri=https%3A%2F%2Fcalendar.example.com%2Fapi%2Fgoogle%2Foauth%2Fcallback')
    expect(result.authUrl).toContain('code_challenge=')
    expect(result.authUrl).toContain('state=')

    await expect(auth.completeWebConnect('https://calendar.example.com/api/google/oauth/callback?state=wrong&code=unused'))
      .rejects.toThrow('Invalid Google sign-in state')
  })
})
