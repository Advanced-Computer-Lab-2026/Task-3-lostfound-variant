
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

  // TODO 3: Load the item when editing.
  useEffect(() => {
    if (!id) return

    async function loadItem() {
      try {
        setError('')
        const res = await api.get(`/items/${id}`)
        const item = res.data.item ?? res.data

        setForm({
          title: item.title ?? '',
          status: item.status ?? 'lost',
          category: item.category ?? 'other',
          location: item.location ?? '',
          description: item.description ?? ''
        })
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load item'
        )
      }
    }

    loadItem()
  }, [id])

  // TODO 1: Update the field that changes.
  function onChange(e) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // TODO 2 and 3: Create or update an item.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const itemData = {
        title: form.title,
        status: form.status,
        category: form.category,
        location: form.location,
        description: form.description
      }

      if (id) {
        await api.patch(`/items/${id}`, itemData)
      } else {
        await api.post('/items', itemData)
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
            name="title"
            type="text"
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
            required
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
            required
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
            name="location"
            type="text"
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
            placeholder="Has a laptop sleeve and a blue keychain."
            value={form.description}
            onChange={onChange}
            rows={4}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm" role="alert">
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
