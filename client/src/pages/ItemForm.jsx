import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Report Item page, routed at /items/new (report) and /items/:id (edit),
// both wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

// values must match the server's enums exactly
const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

const label = s => s[0].toUpperCase() + s.slice(1)

// fixed width so all the fields line up; shrink-0 stops the input squeezing it
const fieldLabel = 'w-24 shrink-0 text-sm font-medium text-zinc-700'

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)

  // Runs whenever the URL switches between /items/new and /items/:id. React
  // keeps this component mounted across those routes, so reset the form
  // first instead of showing the previous item's values.
  useEffect(() => {
    setForm(defaults)
    setError('')
    if (!id) { setLoading(false); return }

    // ignore a response that arrives after we've moved on to another id
    let ignore = false
    setLoading(true)
    api.get('/items/' + id)
      .then(res => {
        if (ignore) return
        const item = res.data.item
        // optional fields can be missing on the document; '' keeps the inputs controlled
        setForm({
          title: item.title ?? '',
          status: item.status ?? defaults.status,
          category: item.category ?? defaults.category,
          location: item.location ?? '',
          description: item.description ?? ''
        })
      })
      .catch(err => { if (!ignore) setError(err?.response?.data?.message || 'Could not load item') })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [id])

  // every input has a `name` matching its key in `form`
  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (saving) return
    setError('')
    setSaving(true)

    // only these fields — never reportedBy, the server takes it from the token.
    // Trimming stops "  " passing as a title and " Library" dodging the duplicate check.
    const body = {
      title: form.title.trim(),
      status: form.status,
      category: form.category,
      location: form.location.trim(),
      description: form.description.trim()
    }

    try {
      if (id) await api.patch('/items/' + id, body)
      else await api.post('/items', body)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save item')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="flex items-center gap-3">
          <span className={fieldLabel}>Title</span>
          <input className="input" name="title" placeholder="e.g. Black backpack"
            value={form.title} onChange={onChange} disabled={loading} />
        </label>
        <label className="flex items-center gap-3">
          <span className={fieldLabel}>Status</span>
          <select className="input" name="status"
            value={form.status} onChange={onChange} disabled={loading}>
            {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className={fieldLabel}>Category</span>
          <select className="input" name="category"
            value={form.category} onChange={onChange} disabled={loading}>
            {CATEGORIES.map(c => <option key={c} value={c}>{label(c)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3">
          <span className={fieldLabel}>Location</span>
          <input className="input" name="location" placeholder="Optional, e.g. Library 2nd floor"
            value={form.location} onChange={onChange} disabled={loading} />
        </label>
        <label className="flex items-start gap-3">
          <span className={fieldLabel + ' pt-2'}>Description</span>
          <textarea className="input" name="description" placeholder="Optional" rows={3}
            value={form.description} onChange={onChange} disabled={loading} />
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn disabled:opacity-50" type="submit" disabled={loading || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
