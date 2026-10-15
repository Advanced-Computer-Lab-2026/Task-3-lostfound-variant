import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// TODO: build the Report Item page — see README.md "Your task".
// This page is already routed at /items/new (report) and /items/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }
const statuses = ['lost', 'found', 'claimed']
const categories = ['electronics', 'clothing', 'documents', 'accessories', 'other']

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO (edit mode): when there is an `id`, load the item and fill the form.
  useEffect(() => {
    if (!id) return

    let active = true
    async function loadItem() {
      try {
        const res = await api.get(`/items/${id}`)
        if (active) {
          const item = res.data.item
          setForm({
            title: item.title || '',
            description: item.description || '',
            category: item.category || 'other',
            status: item.status || 'lost',
            location: item.location || ''
          })
        }
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Failed to load item')
      }
    }

    loadItem()
    return () => { active = false }
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
      const request = id ? api.patch(`/items/${id}`, form) : api.post('/items', form)
      await request
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save item')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-medium">
          Title
          <input className="input mt-1" name="title" value={form.title} onChange={onChange} required />
        </label>

        <label className="block text-sm font-medium">
          Status
          <select className="input mt-1" name="status" value={form.status} onChange={onChange}>
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Category
          <select className="input mt-1" name="category" value={form.category} onChange={onChange}>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Location <span className="font-normal text-zinc-500">(optional)</span>
          <input className="input mt-1" name="location" value={form.location} onChange={onChange} />
        </label>

        <label className="block text-sm font-medium">
          Description <span className="font-normal text-zinc-500">(optional)</span>
          <textarea className="input mt-1" name="description" value={form.description} onChange={onChange} rows="4" />
        </label>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
