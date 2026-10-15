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
        <input className="input" name="title" placeholder="Title (e.g. Black backpack)" aria-label="Title"
          value={form.title} onChange={onChange} disabled={loading} />
        <select className="input" name="status" aria-label="Status"
          value={form.status} onChange={onChange} disabled={loading}>
          {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select className="input" name="category" aria-label="Category"
          value={form.category} onChange={onChange} disabled={loading}>
          {CATEGORIES.map(c => <option key={c} value={c}>{label(c)}</option>)}
        </select>
        <input className="input" name="location" placeholder="Location (optional, e.g. Library 2nd floor)" aria-label="Location"
          value={form.location} onChange={onChange} disabled={loading} />
        <textarea className="input" name="description" placeholder="Description (optional)" aria-label="Description" rows={3}
          value={form.description} onChange={onChange} disabled={loading} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn disabled:opacity-50" type="submit" disabled={loading || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
