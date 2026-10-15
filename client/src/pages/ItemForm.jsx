import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when the URL has an `id`, load that item and pre-fill the form.
  useEffect(() => {
    if (!id) return
    api
      .get(`/items/${id}`)
      .then((res) => {
        // Server replies { item }. `|| ''` keeps inputs controlled if a field is missing/null.
        const item = res.data.item
        setForm({
          title: item.title || '',
          status: item.status || 'lost',
          category: item.category || 'other',
          location: item.location || '',
          description: item.description || '',
        })
      })
      // Errors come back as { message }; show it instead of failing silently.
      .catch((err) => setError(err.response?.data?.message || 'Something went wrong'))
  }, [id])

  // One handler for every input: each input's `name` matches its key in `form`,
  // so [e.target.name] updates just that field and keeps the rest.
  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Create (POST) a new item, or update (PATCH) the existing one when editing,
  // then go back to the list. On failure show the server's message.
  async function onSubmit(e) {
    e.preventDefault() // stop the browser's full-page form submit
    setError('') // clear any previous error before retrying

    // Send only these fields. reportedBy is deliberately left out:
    // the server sets it from the token and rejects requests that include it.
    const { title, status, category, location, description } = form
    const body = { title, status, category, location, description }

    try {
      if (id) {
        await api.patch(`/items/${id}`, body)
      } else {
        await api.post('/items', body)
      }
      nav('/items')
    } catch (err) {
      // e.g. 400 for a too-short title, 409 for a duplicate title at the same location
      setError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {/* Each field's `name` equals its key in `form`, so onChange can update it generically. */}
        <input
          className="input"
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={onChange}
        />
        {/* Option values must match the server's allowed strings exactly. */}
        <select className="input" name="status" value={form.status} onChange={onChange}>
          <option value="lost">lost</option>
          <option value="found">found</option>
          <option value="claimed">claimed</option>
        </select>
        <select className="input" name="category" value={form.category} onChange={onChange}>
          <option value="electronics">electronics</option>
          <option value="clothing">clothing</option>
          <option value="documents">documents</option>
          <option value="accessories">accessories</option>
          <option value="other">other</option>
        </select>
        {/* location and description are optional, so no `required`. */}
        <input
          className="input"
          name="location"
          placeholder="Location (optional)"
          value={form.location}
          onChange={onChange}
        />
        <textarea
          className="input"
          name="description"
          placeholder="Description (optional)"
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
