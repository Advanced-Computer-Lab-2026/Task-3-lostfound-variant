import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Allowed values must match server-side enum exactly
const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

const defaults = { title: '', status: 'lost', category: 'other', location: '', description: '' }

export default function ItemForm() {
  const nav = useNavigate()
  // `id` is undefined on /items/new and a string on /items/:id
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // TODO 3 (edit mode): when there is an `id`, fetch the item and populate the form.
  // This runs once when `id` becomes available (i.e. the user navigated to /items/:id).
  // Without this effect the form would always start empty in edit mode.
  useEffect(() => {
    if (!id) return          // nothing to load on the "new" route
    api.get('/items/' + id)
      .then(res => {
        const { title, status, category, location, description } = res.data.item
        // Fill only the fields the form controls; reportedBy is NOT included on purpose.
        setForm({ title, status, category, location: location ?? '', description: description ?? '' })
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Failed to load item')
      })
  }, [id])

  // TODO 1: keep `form` in sync with every input/select/textarea.
  // `e.target.name` tells us which field changed; `e.target.value` is the new value.
  // Spreading the old state means every other field stays untouched.
  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // TODO 2 + 3: submit handler — POST for new items, PATCH for edits.
  // `e.preventDefault()` stops the browser from reloading the page on submit.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Build the payload from the controlled form state.
    // Do NOT include reportedBy — the server reads it from the JWT and rejects
    // any request that tries to send it in the body.
    const payload = {
      title: form.title,
      status: form.status,
      category: form.category,
      location: form.location,
      description: form.description,
    }

    try {
      if (id) {
        // PATCH /api/items/:id — edit an existing item (e.g. mark as claimed)
        await api.patch('/items/' + id, payload)
      } else {
        // POST /api/items — report a new item
        await api.post('/items', payload)
      }
      // On success navigate back to the list
      nav('/items')
    } catch (err) {
      // Show the server's error message (e.g. 400 validation, 409 duplicate, 403 ownership)
      setError(err?.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>

      <form onSubmit={onSubmit} className="space-y-3">

        {/* Title — required by the server (min 2 chars) */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            className="input"
            placeholder="e.g. Black backpack"
            value={form.title}
            onChange={onChange}
            required
          />
        </div>

        {/* Status — select restricted to server enum values */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="status">Status</label>
          <select id="status" name="status" className="input" value={form.status} onChange={onChange}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Category — select restricted to server enum values */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="category">Category</label>
          <select id="category" name="category" className="input" value={form.category} onChange={onChange}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Location — optional free-text */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="location">Location <span className="text-zinc-400 font-normal">(optional)</span></label>
          <input
            id="location"
            name="location"
            type="text"
            className="input"
            placeholder="e.g. Library 2nd floor"
            value={form.location}
            onChange={onChange}
          />
        </div>

        {/* Description — optional free-text */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">Description <span className="text-zinc-400 font-normal">(optional)</span></label>
          <textarea
            id="description"
            name="description"
            className="input"
            rows={3}
            placeholder="Any extra details…"
            value={form.description}
            onChange={onChange}
          />
        </div>

        {/* Error box — shown when the server returns an error */}
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex items-center gap-3">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </button>
          {/* Cancel sends the user back without making a request */}
          <button className="btn" type="button" onClick={() => nav('/items')}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  )
}
