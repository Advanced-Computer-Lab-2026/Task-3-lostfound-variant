// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ItemForm from './ItemForm'
import { api } from '../api'

vi.mock('../api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

function renderForm(path = '/items/new') {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id" element={<ItemForm />} />
        <Route path="/items" element={<p>Items destination</p>} />
      </Routes>
    </MemoryRouter>
  )
}

const item = {
  title: 'Black backpack', status: 'lost', category: 'accessories',
  location: 'Library 2nd floor', description: 'Blue keychain',
}
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

describe('Report and edit item', () => {
  it('updates all fields, sends only editable fields, and returns to items', async () => {
    api.post.mockResolvedValue({ data: { item } })
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Title'), item.title)
    await user.selectOptions(screen.getByLabelText('Status'), 'found')
    await user.selectOptions(screen.getByLabelText('Category'), item.category)
    await user.type(screen.getByLabelText('Location (optional)'), item.location)
    await user.type(screen.getByLabelText('Description (optional)'), item.description)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(api.post).toHaveBeenCalledWith('/items', { ...item, status: 'found' })
    expect(await screen.findByText('Items destination')).toBeTruthy()
  })

  it.each([
    [400, '"title" length must be at least 2 characters long'],
    [409, 'Duplicate item at this location'],
  ])('displays a server %s error and preserves the form', async (status, message) => {
    api.post.mockRejectedValue({ response: { status, data: { message } } })
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Title'), 'A')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect((await screen.findByRole('alert')).textContent).toBe(message)
    expect(screen.getByLabelText('Title').value).toBe('A')
    expect(api.post).toHaveBeenCalledWith('/items', {
      title: 'A', status: 'lost', category: 'other', location: '', description: '',
    })
    expect(screen.getByRole('button', { name: 'Save' }).disabled).toBe(false)
  })

  it('loads an existing item and patches claimed status without reporter metadata', async () => {
    api.get.mockResolvedValue({ data: { item: { ...item, _id: '123', reportedBy: { name: 'Sara' } } } })
    api.patch.mockResolvedValue({ data: {} })
    const user = userEvent.setup()
    renderForm('/items/123')
    await waitFor(() => expect(screen.getByLabelText('Title').value).toBe(item.title))
    for (const [label, value] of [['Status', item.status], ['Category', item.category], ['Location (optional)', item.location], ['Description (optional)', item.description]]) {
      expect(screen.getByLabelText(label).value).toBe(value)
    }
    await user.selectOptions(screen.getByLabelText('Status'), 'claimed')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(api.get).toHaveBeenCalledWith('/items/123')
    expect(api.patch).toHaveBeenCalledWith('/items/123', { ...item, status: 'claimed' })
    expect(api.post).not.toHaveBeenCalled()
    expect(await screen.findByText('Items destination')).toBeTruthy()
  })

  it('shows an ownership error when editing someone else’s item', async () => {
    api.get.mockResolvedValue({ data: { item } })
    api.patch.mockRejectedValue({ response: { status: 403, data: { message: 'You can only edit items you reported' } } })
    const user = userEvent.setup()
    renderForm('/items/123')
    await waitFor(() => expect(screen.getByLabelText('Title').value).toBe(item.title))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect((await screen.findByRole('alert')).textContent).toBe('You can only edit items you reported')
  })

  it('uses empty controlled values when optional fields are missing', async () => {
    api.get.mockResolvedValue({ data: { item: { title: 'Keys', status: 'found', category: 'other' } } })
    renderForm('/items/123')
    await waitFor(() => expect(screen.getByLabelText('Title').value).toBe('Keys'))
    expect(screen.getByLabelText('Location (optional)').value).toBe('')
    expect(screen.getByLabelText('Description (optional)').value).toBe('')
  })

  it('prevents saving during loading and after a failed load', async () => {
    let rejectLoad
    api.get.mockReturnValue(new Promise((resolve, reject) => { rejectLoad = reject }))
    renderForm('/items/missing')
    expect(screen.getByRole('status').textContent).toBe('Loading item…')
    expect(screen.getByRole('button', { name: 'Save' }).closest('fieldset').disabled).toBe(true)
    rejectLoad({ response: { data: { message: 'Item not found' } } })
    expect((await screen.findByRole('alert')).textContent).toBe('Item not found')
    expect(screen.getByRole('button', { name: 'Save' }).closest('fieldset').disabled).toBe(true)
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('blocks duplicate submissions while saving and handles a network failure', async () => {
    let rejectSave
    api.post.mockReturnValue(new Promise((resolve, reject) => { rejectSave = reject }))
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Title'), 'Keys')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('button', { name: 'Saving…' }))
    expect(api.post).toHaveBeenCalledTimes(1)
    rejectSave(new Error('Network Error'))
    expect((await screen.findByRole('alert')).textContent).toBe('Could not save item')
  })
})
