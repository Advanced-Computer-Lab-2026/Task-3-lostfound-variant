import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

// Must match the server's Joi valid(...) lists exactly
const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // TODO 3: edit mode – load the item and fill the form
  useEffect(() => {
    if (!id) return
    let cancelled = false
    api.get(`/items/${id}`)
      .then(({ data }) => {
        if (cancelled) return
        const { title, status, category, location, description } = data.item
        setForm({
          title: title ?? '',
          status: status ?? defaults.status,
          category: category ?? defaults.category,
          location: location ?? '',
          description: description ?? ''
        })
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load item')
      })
    return () => { cancelled = true }
  }, [id])

  // TODO 1: one handler for every input – uses the input's `name`
  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  // TODO 2 + 3: POST when reporting, PATCH when editing
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const { title, status, category, location, description } = form
    const body = { title, status, category, location, description } // never reportedBy
    try {
      if (id) await api.patch(`/items/${id}`, body)
      else await api.post('/items', body)
      nav('/items')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save item')
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input" name="title" placeholder="Title (e.g. Black backpack)" value={form.title} onChange={onChange} />
        <select className="input" name="status" value={form.status} onChange={onChange}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input" name="location" placeholder="Location (optional, e.g. Library 2nd floor)" value={form.location} onChange={onChange} />
        <textarea className="input" name="description" placeholder="Description (optional)" rows={4} value={form.description} onChange={onChange} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}