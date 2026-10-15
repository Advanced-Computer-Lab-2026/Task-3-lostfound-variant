import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// TODO: build the Report Item page — see README.md "Your task".
// This page is already routed at /items/new (report) and /items/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO (edit mode): when there is an `id`, load the item and fill the form.
  useEffect(() => {
    if (!id) return
    async function loadItem() {
      try {
        const res = await api.get(`/items/${id}`)
        setForm(res.data.item)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load item details.')
      }
    }
    loadItem()
  }, [id])

  // TODO: update `form` when an input changes.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // TODO: POST a new item, or PATCH the existing one when editing,
  // then go back to /items. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      // Destructure to ensure we only send the fields the server expects.
      // If we are in edit mode, the 'form' state might contain the item's
      // _id or reportedBy from the initial load; we must strip those.
      const { title, status, category, location, description } = form
      const payload = { title, status, category, location, description }

      if (id) {
        await api.patch(`/items/${id}`, payload)
      } else {
        await api.post('/items', payload)
      }
      nav('/items')
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred.')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="input"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Status</label>
          <select name="status" value={form.status} onChange={onChange} className="input">
            <option value="lost">lost</option>
            <option value="found">found</option>
            <option value="claimed">claimed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <select name="category" value={form.category} onChange={onChange} className="input">
            <option value="electronics">electronics</option>
            <option value="clothing">clothing</option>
            <option value="documents">documents</option>
            <option value="accessories">accessories</option>
            <option value="other">other</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={onChange}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="input"
            rows="4"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
