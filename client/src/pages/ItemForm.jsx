import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Report Item page — routed at /items/new (report) and /items/:id (edit),
// both wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

// values must match the server's Joi schema exactly
const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

const capitalize = s => s[0].toUpperCase() + s.slice(1)

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // edit mode: load the item and fill the form
  useEffect(() => {
    if (!id) return
    api.get('/items/' + id)
      .then(res => {
        const { title, status, category, location, description } = res.data.item
        // location/description are optional, so fall back to '' to keep the inputs controlled
        setForm({ title, status, category, location: location ?? '', description: description ?? '' })
      })
      .catch(err => setError(err?.response?.data?.message || 'Failed to load item'))
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    // never send reportedBy — the server takes it from the token
    const { title, status, category, location, description } = form
    const body = { title, status, category, location, description }
    try {
      if (id) await api.patch('/items/' + id, body)
      else await api.post('/items', body)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" name="title" placeholder="Title" value={form.title} onChange={onChange} />
        <select className="input" name="status" value={form.status} onChange={onChange}>
          {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
        </select>
        <select className="input" name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
        </select>
        <input className="input" name="location" placeholder="Location (optional)" value={form.location} onChange={onChange} />
        <textarea className="input" name="description" placeholder="Description (optional)" rows={3} value={form.description} onChange={onChange} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
