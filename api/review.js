export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, imageBase64, imageMediaType, scope } = req.body

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()

  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local for local dev, or to Vercel environment variables for production.'
    })
  }

  const systemPrompt = `You are a senior UX evaluator conducting a Heuristic Evaluation using Jakob Nielsen's 10 Usability Heuristics (Nielsen Norman Group methodology).

For each heuristic, identify specific places where the interface fails to adhere to the guideline. Write concrete recommendations for how to fix those usability issues.

Return ONLY a valid JSON object (no markdown, no backticks, no preamble):
{
  "evaluator": "AI Heuristic Evaluator",
  "date": "<today's date as YYYY-MM-DD>",
  "product": "<product or screen name inferred from the design>",
  "task": "<primary user task being evaluated>",
  "summary": "<2 sentence overall evaluation summary>",
  "heuristics": [
    {
      "number": 1,
      "name": "Visibility of System Status",
      "issues": ["<specific issue observed, or empty string if none>"],
      "recommendations": ["<specific fix, or empty string if none>"]
    },
    {
      "number": 2,
      "name": "Match Between System and the Real World",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 3,
      "name": "User Control and Freedom",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 4,
      "name": "Consistency and Standards",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 5,
      "name": "Error Prevention",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 6,
      "name": "Recognition Rather Than Recall",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 7,
      "name": "Flexibility and Efficiency of Use",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 8,
      "name": "Aesthetic and Minimalist Design",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 9,
      "name": "Help Users Recognize, Diagnose, and Recover from Errors",
      "issues": ["..."],
      "recommendations": ["..."]
    },
    {
      "number": 10,
      "name": "Help and Documentation",
      "issues": ["..."],
      "recommendations": ["..."]
    }
  ]
}

Rules:
- Include all 10 heuristics in order
- Be specific to what you observe in the actual design — reference UI elements, labels, flows
- Each heuristic: 0–2 issues and 0–2 matching recommendations
- If no issue found for a heuristic, use issues: ["No significant issues identified"] and recommendations: ["Maintain current approach"]
- Keep each issue and recommendation under 30 words
- Do NOT include design system scores, severity ratings, or quick wins
- Return compact valid JSON only`

  const scopeLabel = scope === 'flow' ? 'entire flow' : scope === 'multi' ? 'multiple screens' : 'single screen'

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
        text: `Conduct a heuristic evaluation of this UI screen. Scope: ${scopeLabel}. Evaluate against all 10 Nielsen heuristics. Be specific about what you observe.`
      }
    ]
  } else {
    userContent = `Conduct a heuristic evaluation of this prototype: ${messages}. Scope: ${scopeLabel}. Evaluate against all 10 Nielsen heuristics based on what is visible or typical for this type of interface.`
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' })
    }

    if (data.stop_reason === 'max_tokens') {
      return res.status(500).json({ error: 'Review response was truncated. Please try again.' })
    }

    const text = data.content?.map(b => b.text || '').join('') || ''
    if (!text) {
      return res.status(500).json({ error: 'Empty response from AI model' })
    }

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
