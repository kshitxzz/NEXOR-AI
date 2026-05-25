export const PROMPT_TEMPLATES = {
  'youtube-script': (input) =>
    `You are an expert YouTube scriptwriter. Create an engaging YouTube video script based on this topic or outline:\n\n${input}\n\nInclude: a strong hook in the first 10 seconds, clear sections with timestamps, conversational tone, visual cues in [brackets], and a compelling CTA at the end. Format with clear headings.`,

  'blog-writer': (input) =>
    `You are an SEO content expert. Write a complete, SEO-optimized blog post based on:\n\n${input}\n\nInclude: compelling title, meta description (155 chars), H2/H3 headings, introduction, body with keywords naturally integrated, bullet points where helpful, and conclusion with CTA. Use markdown formatting.`,

  'email-writer': (input) =>
    `You are a professional email copywriter. Write a polished email based on:\n\n${input}\n\nInclude: subject line options (3), greeting, clear body paragraphs, professional tone, and sign-off. Format clearly.`,

  'caption-generator': (input) =>
    `You are a social media expert. Create 5 engaging captions for this content/theme:\n\n${input}\n\nInclude varied styles (witty, inspirational, question-based), relevant emoji, and hashtag suggestions for each.`,

  'story-generator': (input) =>
    `You are a creative fiction writer. Write an engaging short story based on:\n\n${input}\n\nInclude: vivid characters, compelling plot arc, dialogue, sensory details, and a satisfying ending. Aim for 800-1200 words.`,

  'text-summarizer': (input) =>
    `Summarize the following text concisely while preserving key points:\n\n${input}\n\nProvide: a one-sentence overview, bullet-point key takeaways (5-8), and optional "TL;DR" in under 30 words.`,

  'paraphrasing-tool': (input) =>
    `Paraphrase the following text to improve clarity and variety while keeping the original meaning:\n\n${input}\n\nProvide 2 alternative versions with slightly different tones (formal and casual).`,

  'grammar-fixer': (input) =>
    `Fix all grammar, spelling, punctuation, and style issues in this text:\n\n${input}\n\nReturn: the corrected version first, then a brief list of changes made.`,

  'tone-changer': (input) =>
    `Rewrite the following text in these tones:\n\n${input}\n\nProvide versions in: Professional, Friendly, Persuasive, and Concise (each clearly labeled).`,

  'text-expander': (input) =>
    `Expand the following brief text into detailed, well-structured content:\n\n${input}\n\nAdd relevant details, examples, and transitions while maintaining the core message. Aim for 3x the original length.`,

  'code-explainer': (input) =>
    `Explain this code in beginner-friendly language:\n\n\`\`\`\n${input}\n\`\`\`\n\nInclude: what it does overall, line-by-line or block-by-block breakdown, key concepts used, and one practical tip.`,

  'sql-generator': (input) =>
    `Generate SQL based on this requirement:\n\n${input}\n\nProvide: the SQL query with comments, brief explanation, and notes on indexes or performance if relevant. Use standard SQL syntax.`,

  'regex-generator': (input) =>
    `Generate a regular expression for this requirement:\n\n${input}\n\nProvide: the regex pattern, explanation of each part, example matches, example non-matches, and sample code in JavaScript.`,

  'api-doc-generator': (input) =>
    `Generate API documentation for this endpoint/spec:\n\n${input}\n\nInclude: overview, method & URL, headers, request body schema, response examples (success & error), and status codes. Use markdown.`,

  'debug-helper': (input) =>
    `Help debug this code/error:\n\n${input}\n\nProvide: likely cause(s), step-by-step fix, corrected code if applicable, and prevention tips.`,

  'cold-email-generator': (input) =>
    `Write a high-converting cold email based on:\n\n${input}\n\nInclude: subject lines (3 options), personalized opening, value proposition, social proof placeholder, soft CTA, and P.S. line. Keep under 150 words.`,

  'ad-copy-generator': (input) =>
    `Create high-converting ad copy for:\n\n${input}\n\nProvide: 3 headline options, 3 primary text variations, CTA suggestions, and platform-specific tips (Google/Facebook).`,

  'product-description': (input) =>
    `Write a compelling e-commerce product description for:\n\n${input}\n\nInclude: attention-grabbing headline, benefits-focused bullets, emotional appeal, specs section, and SEO keywords naturally integrated.`,

  'landing-page-copy': (input) =>
    `Write landing page copy for:\n\n${input}\n\nInclude: hero headline & subheadline, 3 benefit sections with headlines, social proof section, FAQ (3 questions), and strong CTA copy.`,

  'sales-pitch': (input) =>
    `Create a persuasive sales pitch for:\n\n${input}\n\nInclude: 30-second elevator pitch, problem-agitation-solution framework, key differentiators, objection handlers, and closing CTA.`,

  'whatsapp-reply': (input) =>
    `Generate professional WhatsApp message replies for this context:\n\n${input}\n\nProvide 3 reply options: brief, detailed, and friendly. Keep messages concise and mobile-friendly.`,

  'chatbot-response': (input) =>
    `Generate chatbot responses for this scenario:\n\n${input}\n\nProvide: greeting, 3 FAQ-style responses, escalation message, and closing. Keep tone helpful and on-brand.`,

  'lead-message': (input) =>
    `Create lead nurturing messages for:\n\n${input}\n\nProvide: initial outreach, follow-up #1 (3 days), follow-up #2 (7 days), and re-engagement message. Each under 100 words.`,

  'faq-generator': (input) =>
    `Generate a comprehensive FAQ section for:\n\n${input}\n\nProvide 10-15 Q&A pairs covering common customer questions, organized by category if applicable. Use clear, helpful language.`,

  'support-reply': (input) =>
    `Write customer support replies for this issue:\n\n${input}\n\nProvide: empathetic acknowledgment, solution steps, alternative if needed, and closing. Tone: professional and caring.`,

  'startup-idea': (input) =>
    `Generate innovative, practical startup ideas based on:\n\n${input}\n\nFor each of 5 ideas include: name, one-liner, problem solved, target market, revenue model, and MVP approach.`,

  'todo-generator': (input) =>
    `Break down this goal/project into actionable to-do items:\n\n${input}\n\nProvide: prioritized task list with estimated time, dependencies noted, and suggested weekly milestones.`,

  'business-name': (input) =>
    `Generate creative business name ideas for:\n\n${input}\n\nProvide 15 names with: meaning/rationale, domain availability tips, and tagline for top 5 picks.`,

  'content-calendar': (input) =>
    `Create a 2-week content calendar for:\n\n${input}\n\nInclude: platform, content type, topic/title, posting day, and brief description for each post. Format as a table.`,

  'hashtag-generator': (input) =>
    `Generate hashtag sets for this content/niche:\n\n${input}\n\nProvide: 10 high-volume, 10 medium, 10 niche hashtags, grouped by platform (Instagram, LinkedIn, Twitter/X), with usage tips.`,
};

export const VALID_TOOL_IDS = Object.keys(PROMPT_TEMPLATES);
