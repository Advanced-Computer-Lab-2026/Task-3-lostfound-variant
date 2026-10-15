import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }
const statuses = ['lost', 'found', 'claimed']
const categories = ['electronics', 'clothing', 'documents', 'accessories', 'other']

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

    async function load() {
      try {
        const { data } = await api.get('/items/' + id)
        if (!active) return
        // Pick only editable fields; never copy reportedBy into a request.
        const item = data.item
        setForm({
          title: item.title ?? '',
          status: item.status ?? 'lost',
          category: item.category ?? 'other',
          location: item.location ?? '',
          description: item.description ?? '',
        })
        setLoadedId(id)
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Could not load item')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (saving || loading || (id && loadedId !== id)) return
    setError('')
    setSaving(true)
    try {
      if (id) await api.patch('/items/' + id, form)
      else await api.post('/items', form)
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
      <form onSubmit={onSubmit} className="space-y-3">
        {loading && <p role="status">Loading item…</p>}
        <fieldset disabled={loading || saving || Boolean(id && loadedId !== id)} className="space-y-3">
          <input aria-label="Title" className="input" name="title" placeholder="Title" required value={form.title} onChange={onChange} />
          <select aria-label="Status" className="input" name="status" value={form.status} onChange={onChange}>
            {statuses.map(status => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
          </select>
          <select aria-label="Category" className="input" name="category" value={form.category} onChange={onChange}>
            {categories.map(category => <option key={category} value={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}
          </select>
          <input aria-label="Location (optional)" className="input" name="location" placeholder="Location (optional)" value={form.location} onChange={onChange} />
          <textarea aria-label="Description (optional)" className="input" name="description" placeholder="Description (optional)" rows={3} value={form.description} onChange={onChange} />
          <button className="btn" type="submit">{saving ? 'Saving…' : 'Save'}</button>
        </fieldset>
        {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  )
}
