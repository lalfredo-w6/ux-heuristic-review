import { useState, useRef } from 'react'
import { NN_HEURISTICS } from './heuristics'

const PURPLE = '#5B21B6'

const STEPS = [
  'Analysing interface against 10 heuristics',
  'Identifying usability issues',
  'Writing recommendations',
  'Compiling evaluation report',
]

export default function App() {
  const [view, setView] = useState('upload')
  const [scope, setScope] = useState('single')
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMediaType, setImageMediaType] = useState('image/png')
  const [imagePreview, setImagePreview] = useState(null)
  const [fileName, setFileName] = useState('')
  const [url, setUrl] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const dragRef = useRef(null)

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        const maxWidth = 1280
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        resolve({
          preview: dataUrl,
          base64: dataUrl.split(',')[1],
          mediaType: 'image/jpeg'
        })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read image file'))
      }
      img.src = url
    })
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setFileName(file.name)
    try {
      const { preview, base64, mediaType } = await compressImage(file)
      setImagePreview(preview)
      setImageBase64(base64)
      setImageMediaType(mediaType)
      setView('preview')
    } catch (err) {
      setError(err.message || 'Could not process image')
      setView('report')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    dragRef.current.style.background = '#F3F4F6'
    handleFile(e.dataTransfer.files[0])
  }

  async function runReview() {
    setView('loading')
    setActiveStep(0)
    setError(null)

    const interval = setInterval(() => {
      setActiveStep(s => {
        if (s < STEPS.length - 1) return s + 1
        clearInterval(interval)
        return s
      })
    }, 900)

    try {
      const body = imageBase64
        ? { imageBase64, imageMediaType, scope }
        : { messages: url, scope }

      const payload = JSON.stringify(body)
      if (payload.length > 4_000_000) {
        throw new Error('Image is too large for upload. Try a smaller screenshot or paste a Figma URL instead.')
      }

      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })

      clearInterval(interval)

      if (!res.ok) {
        let message = 'API error'
        try {
          const err = await res.json()
          message = err.error || message
        } catch {
          message = `Server error (${res.status}). Check that ANTHROPIC_API_KEY is configured.`
        }
        throw new Error(message)
      }

      const data = await res.json()
      setReport(data)
      setView('report')
    } catch (err) {
      clearInterval(interval)
      setError(err.message || 'Could not reach the review API. Run `npm run dev` from the ux-heuristic-review folder.')
      setView('report')
    }
  }

  function reset() {
    setView('upload')
    setImageBase64(null)
    setImagePreview(null)
    setFileName('')
    setUrl('')
    setReport(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-eye-check" style={{ fontSize: 18, color: PURPLE }} aria-hidden="true" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>UX Heuristic Review</h1>
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', paddingLeft: 46 }}>
            Heuristic Evaluation · Nielsen Norman Group
          </p>
        </div>

        {/* Upload view */}
        {view === 'upload' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '1.5rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
              id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
              <div
                ref={dragRef}
                onDragOver={e => { e.preventDefault(); dragRef.current.style.background = '#F5F3FF' }}
                onDragLeave={() => dragRef.current.style.background = '#F9FAFB'}
                onDrop={handleDrop}
                style={{ background: '#F9FAFB', border: '1.5px dashed #D1D5DB', borderRadius: 12, padding: '2.5rem', textAlign: 'center', transition: 'background 0.15s' }}
              >
                <i className="ti ti-photo-up" style={{ fontSize: 36, color: '#9CA3AF', display: 'block', marginBottom: 10 }} aria-hidden="true" />
                <p style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Drop a screenshot or click to upload</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>PNG, JPG supported</p>
              </div>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '1rem 0', color: '#9CA3AF', fontSize: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              or
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Paste Figma prototype URL..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '0.5px solid #D1D5DB', fontSize: 13, color: '#111827', background: '#fff', outline: 'none' }}
              />
              <button
                onClick={() => url.trim() && setView('url-preview')}
                style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}
              >
                Use URL
              </button>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Review scope</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['single', 'flow', 'multi'].map(s => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    style={{
                      height: 32, padding: '0 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500,
                      border: scope === s ? `1.5px solid ${PURPLE}` : '0.5px solid #D1D5DB',
                      background: scope === s ? '#EEEDFE' : '#fff',
                      color: scope === s ? PURPLE : '#6B7280'
                    }}
                  >
                    {s === 'single' ? 'Single screen' : s === 'flow' ? 'Entire flow' : 'Multiple screens'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image preview */}
        {view === 'preview' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '1.5rem' }}>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <img
                src={imagePreview}
                alt="Uploaded screen"
                style={{ width: '100%', borderRadius: 10, border: '0.5px solid #E5E7EB', maxHeight: 320, objectFit: 'cover', display: 'block' }}
              />
              <button
                onClick={reset}
                aria-label="Remove image"
                style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '0.5px solid #D1D5DB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#6B7280' }}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{fileName}</span>
              <button
                onClick={runReview}
                style={{ height: 38, padding: '0 20px', borderRadius: 8, background: PURPLE, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <i className="ti ti-player-play" style={{ fontSize: 13 }} aria-hidden="true" />
                Run review
              </button>
            </div>
          </div>
        )}

        {/* URL preview */}
        {view === 'url-preview' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '1.5rem' }}>
            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <i className="ti ti-link" style={{ fontSize: 20, color: PURPLE, flexShrink: 0 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Figma prototype</p>
                <p style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</p>
              </div>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16 }}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={runReview}
                style={{ height: 38, padding: '0 20px', borderRadius: 8, background: PURPLE, color: '#fff', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <i className="ti ti-player-play" style={{ fontSize: 13 }} aria-hidden="true" />
                Run review
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {view === 'loading' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: `3px solid #E5E7EB`, borderTopColor: PURPLE, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: 14, color: '#374151', fontWeight: 500, marginBottom: '1.5rem' }}>Analysing your prototype...</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280, margin: '0 auto', textAlign: 'left' }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: i < activeStep ? PURPLE : i === activeStep ? PURPLE : '#E5E7EB',
                    opacity: i > activeStep ? 0.4 : 1,
                    transition: 'all 0.3s'
                  }} />
                  <span style={{ color: i <= activeStep ? '#111827' : '#9CA3AF', transition: 'color 0.3s' }}>{step}</span>
                  {i < activeStep && <i className="ti ti-check" style={{ fontSize: 13, color: PURPLE, marginLeft: 'auto' }} aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report */}
        {view === 'report' && (
          <div>
            {error ? (
              <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '2rem', textAlign: 'center' }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 32, color: '#E24B4A', display: 'block', marginBottom: 12 }} aria-hidden="true" />
                <p style={{ fontSize: 15, fontWeight: 500, color: '#111827', marginBottom: 6 }}>Review failed</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: '1.5rem' }}>{error}</p>
                <button onClick={reset} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Try again</button>
              </div>
            ) : report && (
              <>
                {/* Workbook header */}
                <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '1.5rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 4 }}>Heuristic Evaluation Workbook</p>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Nielsen Norman Group</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem 1.5rem', marginBottom: '1rem' }}>
                    {[
                      ['Evaluator', report.evaluator || 'AI Heuristic Evaluator'],
                      ['Date', report.date || new Date().toISOString().slice(0, 10)],
                      ['Product', report.product || '—'],
                      ['Task', report.task || '—'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {report.summary && (
                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, borderTop: '0.5px solid #F3F4F6', paddingTop: '0.75rem' }}>{report.summary}</p>
                  )}
                </div>

                {/* 10 heuristics — workbook format */}
                {(report.heuristics || []).map(h => {
                  const meta = NN_HEURISTICS.find(n => n.number === h.number) || NN_HEURISTICS.find(n => n.name === h.name)
                  const issues = (h.issues || []).filter(Boolean)
                  const recommendations = (h.recommendations || []).filter(Boolean)

                  return (
                    <div key={h.number || h.name} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '1.25rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: '0.75rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEEDFE', color: PURPLE, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {h.number || meta?.number}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 6 }}>{h.name || meta?.name}</h3>
                          {meta?.definition && (
                            <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, marginBottom: 8 }}>{meta.definition}</p>
                          )}
                          {meta?.questions && (
                            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
                              {meta.questions.map((q, i) => <li key={i}>{q}</li>)}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderTop: '0.5px solid #F3F4F6', paddingTop: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>Issues</p>
                          {issues.length > 0 ? issues.map((issue, i) => (
                            <p key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, marginBottom: 6, paddingLeft: 10, borderLeft: `2px solid #E24B4A` }}>{issue}</p>
                          )) : (
                            <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>No issues identified</p>
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 8 }}>Recommendations</p>
                          {recommendations.length > 0 ? recommendations.map((rec, i) => (
                            <p key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, marginBottom: 6, paddingLeft: 10, borderLeft: `2px solid #639922` }}>{rec}</p>
                          )) : (
                            <p style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>No recommendations</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button
                    onClick={reset}
                    style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}
                  >
                    <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
                    Evaluate another
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'heuristic-evaluation-report.json'; a.click()
                    }}
                    style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}
                  >
                    <i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" />
                    Export report
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
