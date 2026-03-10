import * as React from 'react'
import { settingsApi } from '../../api/settings'
import { useProjects } from '../../hooks/useProjects'
import { useToast } from '../UI/Toast'
import { Button } from '../UI/Button'
import type { Settings } from '../../api/types'

const DIGEST_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

interface SettingsPageProps {
  onClose: () => void
}

export function SettingsPage({ onClose }: SettingsPageProps) {
  const toast = useToast()
  const { data: projects = [] } = useProjects()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [savedSettings, setSavedSettings] = React.useState<Settings | null>(null)

  const [defaultProjectId, setDefaultProjectId] = React.useState<string>('')
  const [telegramChatId, setTelegramChatId] = React.useState<string>('')
  const [digestTime, setDigestTime] = React.useState<string>('09:00')
  const [githubWebhookSecret, setGithubWebhookSecret] = React.useState<string>('')
  const [digestTimeError, setDigestTimeError] = React.useState<string>('')

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    settingsApi.get().then((s) => {
      if (cancelled) return
      setSavedSettings(s)
      setDefaultProjectId(s.defaultProjectId ?? '')
      setTelegramChatId(s.telegramChatId ?? '')
      setDigestTime(s.digestTime)
      setGithubWebhookSecret(s.githubWebhookSecret ?? '')
      setLoading(false)
    }).catch(() => {
      if (cancelled) return
      setLoading(false)
      toast({ title: 'Failed to load settings', variant: 'error' })
    })
    return () => { cancelled = true }
  }, [toast])

  function handleCancel() {
    if (savedSettings) {
      setDefaultProjectId(savedSettings.defaultProjectId ?? '')
      setTelegramChatId(savedSettings.telegramChatId ?? '')
      setDigestTime(savedSettings.digestTime)
      setGithubWebhookSecret(savedSettings.githubWebhookSecret ?? '')
      setDigestTimeError('')
    }
    onClose()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setDigestTimeError('')

    if (!DIGEST_TIME_RE.test(digestTime)) {
      setDigestTimeError('Must be in HH:mm format, e.g. 09:00')
      return
    }

    setSaving(true)
    try {
      const updated = await settingsApi.update({
        defaultProjectId: defaultProjectId || null,
        telegramChatId: telegramChatId || null,
        digestTime,
        githubWebhookSecret: githubWebhookSecret || null,
      })
      setSavedSettings(updated)
      toast({ title: 'Settings saved' })
    } catch {
      toast({ title: 'Failed to save settings', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 rounded"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400">Loading settings…</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-auto px-6 py-6 gap-6 max-w-lg">
          {/* Default Project */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="defaultProjectId">
              Default Project
            </label>
            <select
              id="defaultProjectId"
              value={defaultProjectId}
              onChange={(e) => setDefaultProjectId(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Telegram Chat ID */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="telegramChatId">
              Telegram Chat ID
            </label>
            <input
              id="telegramChatId"
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="e.g. -1001234567890"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Digest Time */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="digestTime">
              Digest Time
            </label>
            <input
              id="digestTime"
              type="text"
              value={digestTime}
              onChange={(e) => { setDigestTime(e.target.value); setDigestTimeError('') }}
              placeholder="09:00"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <p className="text-xs text-slate-400">24h format, e.g. 09:00</p>
            {digestTimeError && (
              <p className="text-xs text-red-600" role="alert">{digestTimeError}</p>
            )}
          </div>

          {/* GitHub Webhook Secret */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="githubWebhookSecret">
              GitHub Webhook Secret
            </label>
            <input
              id="githubWebhookSecret"
              type="text"
              value={githubWebhookSecret}
              onChange={(e) => setGithubWebhookSecret(e.target.value)}
              placeholder="Leave blank to disable"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
