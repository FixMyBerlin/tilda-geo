import { describe, expect, test, vi } from 'vitest'
import { newUserRegistrationMailer } from './newUserRegistrationMailer'

// Mock the sendMail function to avoid actually sending emails in tests
vi.mock('./utils/sendMail', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}))

describe('newUserRegistrationMailer', () => {
  test('creates mailer with user data', async () => {
    const user = {
      id: 123,
      osmId: 456789,
      osmName: 'Test User',
      osmDescription: 'Test description',
      email: 'test@example.com',
      createdAt: new Date('2024-01-15T10:30:00Z'),
    }

    const mailer = newUserRegistrationMailer({ user })
    await mailer.send()

    const { sendMail } = await import('./utils/sendMail')
    expect(sendMail).toHaveBeenCalledTimes(1)

    const callArgs = vi.mocked(sendMail).mock.calls[0]?.[0]
    expect(callArgs).toBeDefined()
    expect(callArgs?.Subject).toBe('Neue Benutzerregistrierung: Test User')
    // @ts-expect-error this is not relevant
    expect(callArgs?.From?.Email).toBe('noreply@tilda-geo.de')
    expect(callArgs?.To[0]?.Email).toBe('tilda@fixmycity.de')
    expect(callArgs?.introMarkdown).toContain('Test User')
    expect(callArgs?.introMarkdown).toContain('Zum Zeitpunkt der Registrierung nicht verfügbar')
    expect(callArgs?.ctaLink).toContain('userId=123')
    expect(callArgs?.ctaLink).not.toContain('regionSlug')
  })

  test('creates mailer with user data without optional fields', async () => {
    const user = {
      id: 456,
      osmId: 987654,
      osmName: 'Another User',
      osmDescription: null,
      email: null,
      createdAt: new Date('2024-02-20T14:00:00Z'),
    }

    const mailer = newUserRegistrationMailer({ user })
    await mailer.send()

    const { sendMail } = await import('./utils/sendMail')
    const callArgs = vi.mocked(sendMail).mock.calls[1]?.[0]
    expect(callArgs).toBeDefined()
    expect(callArgs?.Subject).toBe('Neue Benutzerregistrierung: Another User')
    expect(callArgs?.introMarkdown).toContain('Zum Zeitpunkt der Registrierung nicht verfügbar')
    expect(callArgs?.ctaLink).toContain('userId=456')
  })

  test('handles user with null osmName', async () => {
    const user = {
      id: 789,
      osmId: 111222,
      osmName: null,
      osmDescription: null,
      email: null,
      createdAt: new Date('2024-03-01T08:00:00Z'),
    }

    const mailer = newUserRegistrationMailer({ user })
    await mailer.send()

    const { sendMail } = await import('./utils/sendMail')
    const callArgs = vi.mocked(sendMail).mock.calls[2]?.[0]
    expect(callArgs).toBeDefined()
    expect(callArgs?.Subject).toBe('Neue Benutzerregistrierung: Unbekannt')
    expect(callArgs?.introMarkdown).toContain('OSM-Name:** N/A')
  })
})
