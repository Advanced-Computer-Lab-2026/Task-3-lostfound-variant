import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// This page is routed at /items/new (report) and /items/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

const label = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Pull the server's message out of an axios error, with a fallback
function errorMessage(err) {
  return err.response?.data?.message || err.response?.data?.error || err.message || 'Something went wrong'
}

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when there is an `id`, load the item and fill the form.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    api
      .get(`/items/${id}`)
      .then((res) => {
        if (cancelled) return
        const item = res.data.item ?? res.data
        setForm({
          title: item.title ?? '',
          status: item.status ?? 'lost',
          category: item.category ?? 'other',
          location: item.location ?? '',
          description: item.description ?? ''
        })
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // Every input has a `name` matching a key in `form`, so one handler covers all of them.
  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // POST a new item, or PATCH the existing one when editing, then go back to /items.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    // No reportedBy here: the server takes the reporter from the token and rejects it if sent.
    const payload = {
      title: form.title,
      status: form.status,
      category: form.category,
      location: form.location,
      description: form.description
    }

    try {
      if (id) {
        await api.patch(`/items/${id}`, payload)
      } else {
        await api.post('/items', payload)
      }
      nav('/items')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="title"
          placeholder="Title (e.g. Black backpack)"
          value={form.title}
          onChange={onChange}
        />

        <select className="input" name="status" value={form.status} onChange={onChange}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>

        <select className="input" name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {label(c)}
            </option>
          ))}
        </select>

        <input
          className="input"
          name="location"
          placeholder="Location (optional, e.g. Library 2nd floor)"
          value={form.location}
          onChange={onChange}
        />

        <textarea
          className="input"
          name="description"
          placeholder="Description (optional)"
          rows={3}
          value={form.description}
          onChange={onChange}
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}