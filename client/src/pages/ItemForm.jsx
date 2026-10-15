import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    async function loadItem() {
      try {
        const { data } = await api.get(`/items/${id}`)
        setForm({
          title: data.title ?? '',
          status: data.status ?? 'lost',
          category: data.category ?? 'other',
          location: data.location ?? '',
          description: data.description ?? '',
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load item')
      }
    }

    loadItem()
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const { title, status, category, location, description } = form
    const item = { title, status, category, location, description }

    try {
      if (id) {
        await api.patch(`/items/${id}`, item)
      } else {
        await api.post('/items', item)
      }
      nav('/items')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span>Title</span>
          <input className="input w-full" name="title" value={form.title} onChange={onChange} required />
        </label>
        <label className="block space-y-1">
          <span>Status</span>
          <select className="input w-full" name="status" value={form.status} onChange={onChange}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="claimed">Claimed</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span>Category</span>
          <select className="input w-full" name="category" value={form.category} onChange={onChange}>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span>Location (optional)</span>
          <input className="input w-full" name="location" value={form.location} onChange={onChange} />
        </label>
        <label className="block space-y-1">
          <span>Description (optional)</span>
          <textarea className="input w-full" name="description" value={form.description} onChange={onChange} rows={4} />
        </label>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
