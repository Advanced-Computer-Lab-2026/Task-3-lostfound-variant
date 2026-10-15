import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: '', status: '', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch item details when in edit mode
  useEffect(() => {
    if (!id) return

    async function fetchItem() {
      try {
        setLoading(true)
        const res = await api.get(`/items/${id}`)
        const item = res.data.item || res.data

        setForm({
          title: item.title || '',
          description: item.description || '',
          category: item.category || '',
          status: item.status || '',
          location: item.location || '',
        })
      } catch (err) {
        console.error("Failed to load item:", err)
        setError(err.response?.data?.message || 'Failed to load item details.')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [id])

  // Update form state on input change
  function onChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission (POST for new, PATCH for existing)
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
      setError(err.response?.data?.message || 'Something went wrong.')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading item...</div>
  }

  return (
    <div className="max-w-lg mx-auto card p-6 bg-white shadow-sm rounded-lg border border-gray-100">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      
      {error && <div className="mb-4 p-3 text-red-600 bg-red-50 border border-red-200 rounded text-sm">{error}</div>}
      
      <form onSubmit={onSubmit} className="space-y-4">
        {/* title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">status</label>
          <select
            name="status"
            value={form.status}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="" disabled>status</option>
            <option value="lost">lost</option>
            <option value="found">found</option>
            <option value="claimed">claimed</option>
          </select>
        </div>

        {/* category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">category</label>
          <select
            name="category"
            value={form.category}
            onChange={onChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="" disabled>category</option>
            <option value="electronics">electronics</option>
            <option value="clothing">clothing</option>
            <option value="documents">documents</option>
            <option value="accessories">accessories</option>
            <option value="other">other</option>
          </select>
        </div>

        {/* location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">location <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={onChange}
            placeholder="location"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="btn px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded font-medium" type="submit">
          Save
        </button>
      </form>
    </div>
  )
}