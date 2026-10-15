import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Report Item page — routed at /items/new (report) and /items/:id (edit),
// both wrapped in <ProtectedRoute>.

const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']
const STATUSES = ['lost', 'found', 'claimed']

// status and category start empty so the user has to pick them
const defaults = { title: '', description: '', category: '', status: '', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the item and fill the form with its fields.
  useEffect(() => {
    if (!id) return
    api.get('/items/' + id)
      .then(res => {
        const { title, status, category, location, description } = res.data.item
        setForm({ title, status, category, location: location || '', description: description || '' })
      })
      .catch(err => setError(err?.response?.data?.message || 'Could not load item'))
  }, [id])

  // Every input has a `name` matching a key in `form`, so one handler updates them all.
  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.status || !form.category) return setError('Please choose a status and a category')
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
        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input className="input" name="title" placeholder="e.g. Black backpack" value={form.title} onChange={onChange} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Status</span>
          <select className="input" name="status" value={form.status} onChange={onChange}>
            <option value="" disabled>Choose status…</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Category</span>
          <select className="input" name="category" value={form.category} onChange={onChange}>
            <option value="" disabled>Choose category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Location (optional)</span>
          <input className="input" name="location" placeholder="e.g. Library 2nd floor" value={form.location} onChange={onChange} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Description (optional)</span>
          <textarea className="input" name="description" rows={3} value={form.description} onChange={onChange} />
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
