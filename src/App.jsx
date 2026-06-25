import { useState, useRef } from 'react'

const PURPLE = '#5B21B6'

const SEVERITY_COLORS = {
  Critical: { bg: '#FCEBEB', text: '#A32D2D', border: '#E24B4A' },
  Major:    { bg: '#FAEEDA', text: '#854F0B', border: '#EF9F27' },
  Minor:    { bg: '#E6F1FB', text: '#185FA5', border: '#378ADD' },
}

const BAR_COLORS = { 1: '#E24B4A', 2: '#EF9F27', 3: '#EF9F27', 4: '#639922', 5: '#1D9E75' }

const STATUS_STYLES = {
  'Pass':               { bg: '#EAF3DE', text: '#3B6D11', circleBg: '#EAF3DE', circleText: '#3B6D11' },
  'Pass with Revision': { bg: '#FAEEDA', text: '#854F0B', circleBg: '#FAEEDA', circleText: '#854F0B' },
  'Needs Rework':       { bg: '#FCEBEB', text: '#A32D2D', circleBg: '#FCEBEB', circleText: '#A32D2D' },
}

const DS_STATUS = {
  pass: { bg: '#EAF3DE', text: '#3B6D11', label: 'Pass',    icon: 'ti-check' },
  warn: { bg: '#FAEEDA', text: '#854F0B', label: 'Warning', icon: 'ti-alert-triangle' },
  fail: { bg: '#FCEBEB', text: '#A32D2D', label: 'Fail',    icon: 'ti-x' },
}

const STEPS = [
  'Running heuristic evaluation',
  'Checking design system compliance',
  'Evaluating accessibility',
  'Generating recommendations',
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

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImageMediaType(file.type)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target.result
      setImagePreview(dataUrl)
      setImageBase64(dataUrl.split(',')[1])
      setView('preview')
    }
    reader.readAsDataURL(file)
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

      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-eye-check" style={{ fontSize: 18, color: PURPLE }} aria-hidden="true" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>UX Heuristic Review</h1>
          </div>
          <p style={{ fontSize: 14, color: '#6B7280', paddingLeft: 46 }}>
            AI-powered prototype review · Mobitech Design System
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
                {/* Score hero */}
                <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: STATUS_STYLES[report.status]?.circleBg || '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 24, fontWeight: 600, color: STATUS_STYLES[report.status]?.circleText || '#111827', lineHeight: 1 }}>{report.score}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>/100</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{report.status}</h2>
                    <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{report.summary}</p>
                    <span style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 6, background: STATUS_STYLES[report.status]?.bg, color: STATUS_STYLES[report.status]?.text }}>
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Heuristics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, marginBottom: '1rem' }}>
                  {(report.heuristics || []).map(h => (
                    <div key={h.name} style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #E5E7EB', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{h.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{h.score}/5</span>
                      </div>
                      <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: 4, width: `${(h.score / 5) * 100}%`, background: BAR_COLORS[h.score] || '#378ADD', borderRadius: 2, transition: 'width 0.5s' }} />
                      </div>
                      <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{h.note}</p>
                    </div>
                  ))}
                </div>

                {/* Design system compliance */}
                <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '1.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-layout-grid" style={{ fontSize: 15, color: PURPLE }} aria-hidden="true" />
                    Design system compliance
                  </h3>
                  {(report.designSystem || []).map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < report.designSystem.length - 1 ? '0.5px solid #F3F4F6' : 'none' }}>
                      <span style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className={`ti ${DS_STATUS[d.status]?.icon}`} style={{ fontSize: 14, color: DS_STATUS[d.status]?.text }} aria-hidden="true" />
                        {d.label}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, background: DS_STATUS[d.status]?.bg, color: DS_STATUS[d.status]?.text }}>
                        {DS_STATUS[d.status]?.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Findings */}
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 15, color: PURPLE }} aria-hidden="true" />
                    Findings
                  </h3>
                  {(report.findings || []).map((f, i) => {
                    const s = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.Minor
                    return (
                      <div key={i} style={{ background: '#fff', borderRadius: 10, border: `0.5px solid #E5E7EB`, borderLeft: `3px solid ${s.border}`, padding: '12px 14px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#111827', flex: 1 }}>{f.title}</span>
                          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6, background: s.bg, color: s.text, flexShrink: 0 }}>{f.severity}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, marginBottom: 8 }}><strong style={{ color: '#374151', fontWeight: 500 }}>Impact: </strong>{f.impact}</p>
                        <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                          <i className="ti ti-bulb" style={{ color: PURPLE, marginRight: 4, fontSize: 13, verticalAlign: -1 }} aria-hidden="true" />
                          {f.recommendation}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick wins */}
                <div style={{ background: '#F5F3FF', borderRadius: 16, padding: '1.25rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="ti ti-bolt" style={{ fontSize: 15, color: PURPLE }} aria-hidden="true" />
                    Quick wins
                  </h3>
                  {(report.quickWins || []).map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                      <i className="ti ti-circle-check" style={{ color: PURPLE, fontSize: 15, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
                      {q}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={reset}
                    style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}
                  >
                    <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
                    Review another
                  </button>
                  <button
                    onClick={() => window.open('mailto:?subject=UX Review Report&body=' + encodeURIComponent(JSON.stringify(report, null, 2)))}
                    style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}
                  >
                    <i className="ti ti-mail" style={{ fontSize: 13 }} aria-hidden="true" />
                    Share report
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ux-review-report.json'; a.click()
                    }}
                    style={{ height: 36, padding: '0 16px', borderRadius: 8, border: '0.5px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}
                  >
                    <i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" />
                    Export JSON
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
