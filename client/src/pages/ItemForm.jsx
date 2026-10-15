import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Must match the server's enums exactly, or it rejects the request.
const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the item and copy only the editable fields into the form.
  useEffect(() => {
    if (!id) return
    api.get('/items/' + id)
      .then(res => {
        const { title, status, category, location, description } = res.data.item
        // ?? '' keeps optional fields as strings so the inputs stay controlled
        setForm({ title, status, category, location: location ?? '', description: description ?? '' })
      })
      .catch(err => setError(err?.response?.data?.message || 'Could not load item'))
  }, [id])

  // Each input's `name` matches a key in `form`, so one handler covers them all.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      // Never send reportedBy: the server takes it from the token and rejects it in the body.
      const { title, status, category, location, description } = form
      const body = { title, status, category, location, description }
      if (id) await api.patch('/items/' + id, body)
      else await api.post('/items', body)
      nav('/items')
    } catch (err) {
      // 400 (validation), 403 (not your item), 409 (duplicate) all send { message }
      setError(err?.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" name="title" placeholder="Title (e.g. Black backpack)" value={form.title} onChange={onChange} />
        <select className="input" name="status" value={form.status} onChange={onChange}>
          {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="input" name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
        </select>
        <input className="input" name="location" placeholder="Location (optional, e.g. Library 2nd floor)" value={form.location} onChange={onChange} />
        <textarea className="input" name="description" rows={3} placeholder="Description (optional)" value={form.description} onChange={onChange} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
