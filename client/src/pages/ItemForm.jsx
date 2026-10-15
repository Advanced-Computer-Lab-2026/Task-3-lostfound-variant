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
    if (!id) {
      setForm(defaults)
      return
    }

    let active = true
    async function loadItem() {
      setError('')
      try {
        const res = await api.get(`/items/${id}`)
        if (active) {
          const item = res.data.item
          setForm({
            title: item.title || '',
            status: item.status || 'lost',
            category: item.category || 'other',
            location: item.location || '',
            description: item.description || '',
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
    setForm(current => ({ ...current, [name]: value }))
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
        <label className="block space-y-1">
          <span className="text-sm font-medium">Title</span>
          <input className="input" name="title" value={form.title} onChange={onChange} placeholder="Black backpack" required />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Status</span>
          <select className="input" name="status" value={form.status} onChange={onChange}>
            {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Category</span>
          <select className="input" name="category" value={form.category} onChange={onChange}>
            {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Location <span className="font-normal text-zinc-500">(optional)</span></span>
          <input className="input" name="location" value={form.location} onChange={onChange} placeholder="Library 2nd floor" />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Description <span className="font-normal text-zinc-500">(optional)</span></span>
          <textarea className="input min-h-28" name="description" value={form.description} onChange={onChange} rows={4} />
        </label>

        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}