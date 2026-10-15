import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }
const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    async function loadItem() {
      setError('')
      try {
        const res = await api.get(`/items/${id}`)
        if (active) {
          const item = res.data.item
          setForm({
            title: item.title || '',
            status: item.status || defaults.status,
            category: item.category || defaults.category,
            location: item.location || '',
            description: item.description || ''
          })
        }
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load item')
      }
    }
    loadItem()
    return () => { active = false }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (id) await api.patch(`/items/${id}`, form)
      else await api.post('/items', form)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save item')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="title">Title</label>
        <input id="title" name="title" className="input w-full" value={form.title} onChange={onChange} required />

        <label className="block text-sm font-medium" htmlFor="status">Status</label>
        <select id="status" name="status" className="input w-full" value={form.status} onChange={onChange}>
          {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
        </select>

        <label className="block text-sm font-medium" htmlFor="category">Category</label>
        <select id="category" name="category" className="input w-full" value={form.category} onChange={onChange}>
          {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
        </select>

        <label className="block text-sm font-medium" htmlFor="location">Location (optional)</label>
        <input id="location" name="location" className="input w-full" value={form.location} onChange={onChange} />

        <label className="block text-sm font-medium" htmlFor="description">Description (optional)</label>
        <textarea id="description" name="description" className="input w-full" rows="4" value={form.description} onChange={onChange} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
