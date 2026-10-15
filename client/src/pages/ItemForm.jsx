import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = {
  title: '',
  description: '',
  category: 'other',
  status: 'lost',
  location: '',
}

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: load the existing item
  useEffect(() => {
    if (!id) return

    async function loadItem() {
      try {
        const res = await api.get(`/items/${id}`)

        const item = res.data.item ?? res.data

        setForm({
          title: item.title ?? '',
          description: item.description ?? '',
          category: item.category ?? 'other',
          status: item.status ?? 'lost',
          location: item.location ?? '',
        })
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load item'
        )
      }
    }

    loadItem()
  }, [id])

  // Update form state whenever an input changes
  function onChange(e) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Create or edit item
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
      setError(
        err.response?.data?.message || 'Something went wrong'
      )
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">
        {id ? 'Edit' : 'Report'} Item
      </h1>

      <form onSubmit={onSubmit} className="space-y-3">

        {/* Title */}
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Title"
          className="w-full border rounded px-3 py-2"
        />

        {/* Status */}
        <select
          name="status"
          value={form.status}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="lost">Lost</option>
          <option value="found">Found</option>
          <option value="claimed">Claimed</option>
        </select>

        {/* Category */}
        <select
          name="category"
          value={form.category}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="documents">Documents</option>
          <option value="accessories">Accessories</option>
          <option value="other">Other</option>
        </select>

        {/* Location */}
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={onChange}
          placeholder="Location"
          className="w-full border rounded px-3 py-2"
        />

        {/* Description */}
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Description"
          rows="4"
          className="w-full border rounded px-3 py-2"
        />

        {/* Error */}
        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          className="btn"
          type="submit"
        >
          Save
        </button>
      </form>
    </div>
  )
}