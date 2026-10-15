import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when there is an `id`, load the item from the server and populate the form fields.
  // If there is no `id`, reset the form back to default initial values.
  useEffect(() => {
    if (!id) {
      setForm(defaults)
      setError('')
      return
    }

    api.get(`/items/${id}`)
      .then(res => {
        const item = res.data.item
        setForm({
          title: item.title || '',
          description: item.description || '',
          category: item.category || 'other',
          status: item.status || 'lost',
          location: item.location || ''
        })
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'Failed to load item')
      })
  }, [id])

  // Update the corresponding property in `form` whenever an input, select, or textarea changes.
  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // POST a new item when creating, or PATCH the existing item when editing.
  // On success, redirect to /items. On failure, display the server's error message.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const payload = {
      title: form.title,
      status: form.status,
      category: form.category,
      location: form.location,
      description: form.description
    }

    try {
      if (id) {
        await api.patch(`/items/${id}`, payload)
      } else {
        await api.post('/items', payload)
      }
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save item')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="input"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={onChange}
        />
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
        <input
          className="input"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={onChange}
        />
        <textarea
          className="input"
          name="description"
          placeholder="Description"
          rows={4}
          value={form.description}
          onChange={onChange}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
