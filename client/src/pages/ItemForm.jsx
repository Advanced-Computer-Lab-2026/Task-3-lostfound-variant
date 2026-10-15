import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }
const statuses = ['lost', 'found', 'claimed']
const categories = ['electronics', 'clothing', 'documents', 'accessories', 'other']

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setLoading(true)
    setError('')

    api.get(`/items/${id}`)
      .then(({ data }) => {
        if (cancelled) return
        const { title, status, category, location = '', description = '' } = data.item
        setForm({ title, status, category, location, description })
      })
      .catch((err) => {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load item')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      title: form.title,
      status: form.status,
      category: form.category,
      location: form.location,
      description: form.description
    }

    try {
      if (id) await api.patch(`/items/${id}`, payload)
      else await api.post('/items', payload)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save item')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-lg mx-auto card">Loading item…</div>

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Black backpack"
          aria-label="Title"
          required
        />
        <select className="input" name="status" value={form.status} onChange={onChange} aria-label="Status">
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select className="input" name="category" value={form.category} onChange={onChange} aria-label="Category">
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <input
          className="input"
          name="location"
          value={form.location}
          onChange={onChange}
          placeholder="Library 2nd floor (optional)"
          aria-label="Location"
        />
        <textarea
          className="input min-h-28"
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Description (optional)"
          aria-label="Description"
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
