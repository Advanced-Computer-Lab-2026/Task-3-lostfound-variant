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
  const [loadedId, setLoadedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const canSave = !loading && !saving && (!id || loadedId === id)

  useEffect(() => {
    // Ignore a response if the user leaves or switches to another item.
    let active = true
    setError('')
    setForm(defaults)
    setLoadedId(null)
    setLoading(Boolean(id))

    if (!id) return

    async function loadItem() {
      try {
        const { data } = await api.get('/items/' + id)
        if (!active) return
        const item = data.item
        // Copy only editable fields; reportedBy must never be submitted.
        setForm({
          title: item.title,
          status: item.status,
          category: item.category,
          location: item.location ?? '',
          description: item.description ?? ''
        })
        setLoadedId(id)
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load item')
      } finally {
        if (active) setLoading(false)
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
    if (!canSave) return
    setError('')
    setSaving(true)
    const { title, status, category, location, description } = form
    const payload = { title, status, category, location, description }

    try {
      if (id) {
        await api.patch('/items/' + id, payload)
      } else {
        await api.post('/items', payload)
      }
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
      {loading && <p role="status" className="text-sm text-zinc-600 mb-3">Loading item…</p>}
      <form onSubmit={onSubmit}>
        <fieldset disabled={!canSave} className="space-y-3">
          <input className="input" type="text" name="title" aria-label="Title" placeholder="Title (e.g. Black backpack)" required value={form.title} onChange={onChange} />
          <select className="input" name="status" aria-label="Status" value={form.status} onChange={onChange}>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="claimed">Claimed</option>
          </select>
          <select className="input" name="category" aria-label="Category" value={form.category} onChange={onChange}>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="other">Other</option>
          </select>
          <input className="input" type="text" name="location" aria-label="Location (optional)" placeholder="Location (optional)" value={form.location} onChange={onChange} />
          <textarea className="input" name="description" aria-label="Description (optional)" placeholder="Description (optional)" rows={2} value={form.description} onChange={onChange} />
          {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
          <button className="btn disabled:opacity-50" type="submit">{saving ? 'Saving…' : 'Save'}</button>
        </fieldset>
      </form>
    </div>
  )
}
