export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, imageBase64, imageMediaType, scope } = req.body

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local for local dev, or to Vercel environment variables for production.'
    })
  }

  const systemPrompt = `You are a senior UX and Design System reviewer for Mobichat / Mobitech, a SaaS product in the Indonesian market.
Evaluate the provided design/prototype against usability heuristics and design system standards.

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks, no preamble):
{
  "score": <number 0-100>,
  "status": "<Pass|Pass with Revision|Needs Rework>",
  "summary": "<2 sentence summary of overall quality>",
  "heuristics": [
    {"name": "Clarity", "score": <1-5>, "note": "<specific observation>"},
    {"name": "Information Architecture", "score": <1-5>, "note": "<specific observation>"},
    {"name": "Efficiency", "score": <1-5>, "note": "<specific observation>"},
    {"name": "Consistency", "score": <1-5>, "note": "<specific observation>"},
    {"name": "Error Prevention", "score": <1-5>, "note": "<specific observation>"},
    {"name": "Accessibility", "score": <1-5>, "note": "<specific observation>"}
  ],
  "designSystem": [
    {"label": "Component usage", "status": "<pass|warn|fail>", "note": "<brief>"},
    {"label": "Spacing", "status": "<pass|warn|fail>", "note": "<brief>"},
    {"label": "Typography", "status": "<pass|warn|fail>", "note": "<brief>"},
    {"label": "Color tokens", "status": "<pass|warn|fail>", "note": "<brief>"},
    {"label": "States coverage", "status": "<pass|warn|fail>", "note": "<brief>"}
  ],
  "findings": [
    {
      "title": "<concise issue title>",
      "severity": "<Critical|Major|Minor>",
      "impact": "<user impact>",
      "recommendation": "<specific, actionable fix>"
    }
  ],
  "quickWins": [
    "<actionable quick win 1>",
    "<actionable quick win 2>",
    "<actionable quick win 3>"
  ]
}

Rules:
- findings: 3-5 items, mix of severities
- Critical = blocks user task completion
- Major = significantly degrades UX
- Minor = polish / consistency issue
- Be specific to what you observe, not generic
- recommendations must be concrete and implementable`

  let userContent

  if (imageBase64) {
    userContent = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageMediaType || 'image/png',
          data: imageBase64
        }
      },
      {
        type: 'text',
        text: `Review this UI screen. Scope: ${scope || 'single screen'}. Evaluate thoroughly against all 6 heuristics. Be specific about what you observe in the actual design.`
      }
    ]
  } else {
    userContent = `Review this prototype URL: ${messages}. Scope: ${scope || 'single screen'}. Provide a thorough heuristic evaluation based on common SaaS patterns. Be specific and practical about likely issues.`
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' })
    }

    const text = data.content.map(b => b.text || '').join('')
    const clean = text.replace(/```json\n?|```/g, '').trim()
    let report
    try {
      report = JSON.parse(clean)
    } catch {
      const match = clean.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Model did not return valid JSON')
      report = JSON.parse(match[0])
    }

    return res.status(200).json(report)
  } catch (err) {
    console.error('Review API error:', err)
    return res.status(500).json({ error: err.message || 'Failed to generate review' })
  }
}
