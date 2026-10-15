
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
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)

  // TODO 3: Load the existing item when editing
  useEffect(() => {
    if (!id) {
      setForm(defaults)
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadItem() {
      setLoading(true)
      setError('')

      try {
        const res = await api.get(`/items/${id}`)

        console.log('GET ITEM RESPONSE:', res.data)

        const item =
          res.data?.item ??
          res.data?.data?.item ??
          res.data?.data ??
          res.data

        if (!item || !item.title) {
          throw new Error('Could not read item details')
        }

        if (!cancelled) {
          setForm({
            title: item.title,
            status: item.status,
            category: item.category,
            location: item.location || '',
            description: item.description || ''
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Failed to load item'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadItem()

    return () => {
      cancelled = true
    }
  }, [id])

  // TODO 1: Update the form when an input changes
  function onChange(e) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // TODO 2 and 3: Create or edit an item
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = {
        title: form.title,
        status: form.status,
        category: form.category,
        location: form.location,
        description: form.description
      }

      if (id) {
        await api.patch(`/items/${id}`, data)
      } else {
        await api.post('/items', data)
      }

      nav('/items')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to save item'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">
        {id ? 'Edit' : 'Report'} Item
      </h1>

      {loading ? (
        <p>Loading item...</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">

          <div>
            <label className="block mb-1">Title</label>
            <input
              className="input"
              type="text"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Black backpack"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Status</label>
            <select
              className="input"
              name="status"
              value={form.status}
              onChange={onChange}
            >
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Category</label>
            <select
              className="input"
              name="category"
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
            <label className="block mb-1">Location</label>
            <input
              className="input"
              type="text"
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="Library 2nd floor"
            />
          </div>

          <div>
            <label className="block mb-1">Description</label>
            <textarea
              className="input"
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Describe the item"
              rows={4}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            className="btn"
            type="submit"
            disabled={saving || (Boolean(id) && !form.title)}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

        </form>
      )}
    </div>
  )
}
