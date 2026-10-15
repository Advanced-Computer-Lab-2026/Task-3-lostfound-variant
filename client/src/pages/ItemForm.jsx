import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [loadedId, setLoadedId] = useState(null)

  useEffect(() => {
    let active = true
    setForm(defaults)
    setError('')
    setLoadedId(null)
    setLoading(Boolean(id))
    if (!id) return

    async function loadItem() {
      try {
        const { data } = await api.get(`/items/${id}`)
        if (!active) return
        const { title, status, category, location, description } = data.item
        setForm({ title, status, category, location: location ?? '', description: description ?? '' })
        setLoadedId(id)
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load item')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadItem()
    // Ignore a response if we leave the page or switch to another item.
    return () => { active = false }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(current => ({ ...current, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (saving || loading || (id && loadedId !== id)) return
    setError('')
    setSaving(true)
    const { title, status, category, location, description } = form
    const payload = { title, status, category, location, description }
    try {
      if (id) await api.patch(`/items/${id}`, payload)
      else await api.post('/items', payload)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      {loading && <p role="status" className="mb-3">Loading item...</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <fieldset disabled={loading || saving || Boolean(id && loadedId !== id)} className="space-y-3">
          <div>
            <label htmlFor="title" className="block text-sm mb-1">Title</label>
            <input id="title" name="title" className="input" placeholder="Black backpack" value={form.title} onChange={onChange} required />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm mb-1">Status</label>
            <select id="status" name="status" className="input" value={form.status} onChange={onChange}>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm mb-1">Category</label>
            <select id="category" name="category" className="input" value={form.category} onChange={onChange}>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="documents">Documents</option>
              <option value="accessories">Accessories</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm mb-1">Location (optional)</label>
            <input id="location" name="location" className="input" placeholder="Library 2nd floor" value={form.location} onChange={onChange} />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm mb-1">Description (optional)</label>
            <textarea id="description" name="description" className="input" rows={4} value={form.description} onChange={onChange} />
          </div>
          <button className="btn" type="submit">{saving ? 'Saving...' : 'Save'}</button>
        </fieldset>
        {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  )
}
