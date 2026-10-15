import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// TODO: build the Report Item page — see README.md "Your task".
// This page is already routed at /items/new (report) and /items/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }
const categories = ['electronics', 'clothing', 'documents', 'accessories', 'other']
const statuses = ['lost', 'found', 'claimed']

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    let cancelled = false

    if (!id) {
      setForm(defaults)
      setError('')
      setLoading(false)
      return () => { cancelled = true }
    }

    async function loadItem() {
      setLoading(true)
      setError('')
      try {
        const res = await api.get(`/items/${id}`)
        if (cancelled) return
        const item = res.data.item
        setForm({
          title: item.title,
          description: item.description ?? '',
          category: item.category,
          status: item.status,
          location: item.location ?? ''
        })
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Unable to load item')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadItem()
    return () => { cancelled = true }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(current => ({ ...current, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (id) {
        await api.patch(`/items/${id}`, form)
      } else {
        await api.post('/items', form)
      }
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save item')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <fieldset disabled={loading} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Title</span>
            <input className="input" name="title" value={form.title} onChange={onChange} required minLength={2} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Status</span>
            <select className="input" name="status" value={form.status} onChange={onChange}>
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Category</span>
            <select className="input" name="category" value={form.category} onChange={onChange}>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Location (optional)</span>
            <input className="input" name="location" value={form.location} onChange={onChange} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Description (optional)</span>
            <textarea className="input" name="description" value={form.description} onChange={onChange} rows={4} />
          </label>
        </fieldset>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={loading}>Save</button>
      </form>
    </div>
  )
}