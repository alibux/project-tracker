import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPage } from '../components/Settings/SettingsPage'
import type { Settings } from '../api/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockSettings: Settings = {
  id: 'settings-1',
  defaultProjectId: 'proj-1',
  telegramChatId: '-1001234567890',
  digestTime: '08:00',
  githubWebhookSecret: 'secret-abc',
}

const mockProjects = [
  { id: 'proj-1', name: 'Alpha', description: null, createdAt: '', updatedAt: '' },
  { id: 'proj-2', name: 'Beta', description: null, createdAt: '', updatedAt: '' },
]

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGet = vi.fn()
const mockUpdate = vi.fn()

vi.mock('../api/settings', () => ({
  settingsApi: {
    get: () => mockGet(),
    update: (data: unknown) => mockUpdate(data),
  },
}))

vi.mock('../hooks/useProjects', () => ({
  useProjects: () => ({ data: mockProjects }),
}))

const mockToast = vi.fn()
vi.mock('../components/UI/Toast', () => ({
  useToast: () => mockToast,
}))

// ── Helper ────────────────────────────────────────────────────────────────────

function renderPage(onClose = vi.fn()) {
  return render(<SettingsPage onClose={onClose} />)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue(mockSettings)
    mockUpdate.mockResolvedValue(mockSettings)
  })

  it('renders all 4 fields pre-filled from fetched settings', async () => {
    renderPage()

    await waitFor(() => expect(screen.queryByText('Loading settings…')).not.toBeInTheDocument())

    const select = screen.getByLabelText('Default Project') as HTMLSelectElement
    expect(select.value).toBe('proj-1')

    const telegram = screen.getByLabelText('Telegram Chat ID') as HTMLInputElement
    expect(telegram.value).toBe('-1001234567890')

    const digest = screen.getByLabelText('Digest Time') as HTMLInputElement
    expect(digest.value).toBe('08:00')

    const webhook = screen.getByLabelText('GitHub Webhook Secret') as HTMLInputElement
    expect(webhook.value).toBe('secret-abc')
  })

  it('shows loading state while settings are being fetched', () => {
    // Never resolves during this test
    mockGet.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Loading settings…')).toBeInTheDocument()
  })

  it('calls settingsApi.update with correct values on save', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.queryByText('Loading settings…')).not.toBeInTheDocument())

    // Change telegram chat id
    const telegram = screen.getByLabelText('Telegram Chat ID')
    await user.clear(telegram)
    await user.type(telegram, '-9999')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith({
        defaultProjectId: 'proj-1',
        telegramChatId: '-9999',
        digestTime: '08:00',
        githubWebhookSecret: 'secret-abc',
      }),
    )
  })

  it('shows inline validation error when digestTime format is invalid', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.queryByText('Loading settings…')).not.toBeInTheDocument())

    const digest = screen.getByLabelText('Digest Time')
    await user.clear(digest)
    await user.type(digest, 'bad-value')

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/HH:mm/i)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('resets form to saved values on cancel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderPage(onClose)

    await waitFor(() => expect(screen.queryByText('Loading settings…')).not.toBeInTheDocument())

    const telegram = screen.getByLabelText('Telegram Chat ID') as HTMLInputElement
    await user.clear(telegram)
    await user.type(telegram, 'changed-value')
    expect(telegram.value).toBe('changed-value')

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    // onClose should be called
    expect(onClose).toHaveBeenCalled()
  })
})
