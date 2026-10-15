import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// This page is routed at /items/new (report) and /items/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']
const STATUSES = ['lost', 'found', 'claimed']

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when there is an `id`, load the item and fill the form.
  useEffect(() => {
    if (!id) return
    setError('')
    api.get('/items/' + id)
      .then(res => {
        const { title, status, category, location, description } = res.data.item
        setForm({
          title: title || '',
          status: status || defaults.status,
          category: category || defaults.category,
          location: location || '',
          description: description || ''
        })
      })
      .catch(err => setError(err?.response?.data?.message || 'Failed to load item'))
  }, [id])

  // Every input has a `name` matching a key in `form`, so one handler covers them all.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // POST a new item, or PATCH the existing one when editing,
  // then go back to /items. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    // reportedBy is deliberately not sent: the server takes it from the token.
    const { title, status, category, location, description } = form
    const payload = { title, status, category, location, description }
    try {
      if (id) await api.patch('/items/' + id, payload)
      else await api.post('/items', payload)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
          <input id="title" className="input" name="title" value={form.title} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
          <select id="status" className="input" name="status" value={form.status} onChange={onChange}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
          <select id="category" className="input" name="category" value={form.category} onChange={onChange}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1">Location (optional)</label>
          <input id="location" className="input" name="location" value={form.location} onChange={onChange} />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea id="description" className="input" name="description" rows={4} value={form.description} onChange={onChange} />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
