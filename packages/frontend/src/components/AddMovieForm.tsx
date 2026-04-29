import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ADD_MOVIE, GET_STATS } from '../graphql/queries'

export function AddMovieForm() {
  const [form, setForm] = useState({
    title: '',
    rating: '',
    genres: '',
    year: '',
    description: '',
  })
  const [success, setSuccess] = useState('')
  const [addMovie, { loading, error }] = useMutation(ADD_MOVIE, {
    refetchQueries: [{ query: GET_STATS }],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')

    const input: Record<string, unknown> = {
      title: form.title.trim(),
      rating: parseFloat(form.rating),
    }
    if (form.genres.trim()) {
      input.genres = form.genres.split(',').map((g) => g.trim()).filter(Boolean)
    }
    if (form.year.trim()) input.year = parseInt(form.year, 10)
    if (form.description.trim()) input.description = form.description.trim()

    await addMovie({ variables: { input } })
    setSuccess(`"${form.title}" added successfully.`)
    setForm({ title: '', rating: '', genres: '', year: '', description: '' })
  }

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="panel">
      <h2>Add a Movie</h2>
      <form className="add-form" onSubmit={handleSubmit}>
        <label>
          Title *
          <input required value={form.title} onChange={set('title')} placeholder="e.g. Inception" />
        </label>
        <label>
          Rating * (0–10)
          <input
            required
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={form.rating}
            onChange={set('rating')}
            placeholder="e.g. 8.8"
          />
        </label>
        <label>
          Genres (comma-separated)
          <input value={form.genres} onChange={set('genres')} placeholder="e.g. Sci-Fi, Thriller" />
        </label>
        <label>
          Year
          <input type="number" value={form.year} onChange={set('year')} placeholder="e.g. 2010" />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={set('description')} rows={3} />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Adding…' : 'Add Movie'}
        </button>
        {success && <p className="success-msg">{success}</p>}
        {error && <p className="error-msg">Error: {error.message}</p>}
      </form>
    </div>
  )
}
