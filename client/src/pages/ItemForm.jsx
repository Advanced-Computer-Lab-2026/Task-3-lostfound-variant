
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = {
  title: '',
  description: '',
  category: 'other',
  status: 'lost',
  location: ''
}

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Load item data when editing
  useEffect(() => {
    if (!id) return

    async function loadItem() {
      try {
        const res = await api.get(`/items/${id}`)
        const item = res.data.item

        setForm({
          title: item.title,
          status: item.status,
          category: item.category,
          location: item.location || '',
          description: item.description || ''
        })
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load item'
        )
      }
    }

    loadItem()
  }, [id])

  // Update form values
  function onChange(e) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
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
        err.response?.data?.message || 'Failed to save item'
      )
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">
        {id ? 'Edit' : 'Report'} Item
      </h1>

      <form onSubmit={onSubmit} className="space-y-3">

        <div>
          <label htmlFor="title" className="block mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            className="input w-full"
            placeholder="Black backpack"
            value={form.title}
            onChange={onChange}
            required
          />
        </div>

        <div>
          <label htmlFor="status" className="block mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="input w-full"
            value={form.status}
            onChange={onChange}
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="claimed">Claimed</option>
          </select>
        </div>

        <div>
          <label htmlFor="category" className="block mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="input w-full"
            value={form.category}
            onChange={onChange}
          >
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block mb-1">
            Location (optional)
          </label>
          <input
            id="location"
            type="text"
            name="location"
            className="input w-full"
            placeholder="Library 2nd floor"
            value={form.location}
            onChange={onChange}
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            className="input w-full"
            placeholder="Describe the item..."
            value={form.description}
            onChange={onChange}
            rows={4}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button className="btn" type="submit">
          Save
        </button>

      </form>
    </div>
  )
}
