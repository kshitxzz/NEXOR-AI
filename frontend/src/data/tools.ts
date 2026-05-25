export interface Tool {
  id: string;
  name: string;
  description: string;
  placeholder: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const categories: Category[] = [
  {
    id: 'writing',
    name: 'AI Writing Tools',
    description: 'Create compelling content for blogs, emails, and social media',
    icon: '✍️',
  },
  {
    id: 'text',
    name: 'Text Tools',
    description: 'Summarize, paraphrase, and refine your text instantly',
    icon: '📝',
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    description: 'Code explanations, SQL, regex, and debugging assistance',
    icon: '💻',
  },
  {
    id: 'marketing',
    name: 'Marketing Tools',
    description: 'High-converting copy for ads, emails, and landing pages',
    icon: '📈',
  },
  {
    id: 'automation',
    name: 'Automation Tools',
    description: 'Chatbots, support replies, and lead nurturing messages',
    icon: '⚡',
  },
  {
    id: 'productivity',
    name: 'Productivity Tools',
    description: 'Ideas, planning, and content strategy generators',
    icon: '🚀',
  },
];

export const tools: Tool[] = [
  {
    id: 'youtube-script',
    name: 'YouTube Script Generator',
    description: 'Engaging video scripts with hooks and CTAs',
    placeholder: 'Describe your video topic, audience, and key points...',
    categoryId: 'writing',
  },
  {
    id: 'blog-writer',
    name: 'Blog Writer',
    description: 'SEO-optimized blog posts with headings',
    placeholder: 'Enter your blog topic, keywords, and outline...',
    categoryId: 'writing',
  },
  {
    id: 'email-writer',
    name: 'Email Writer',
    description: 'Professional emails with subject lines',
    placeholder: 'Describe the email purpose, recipient, and key message...',
    categoryId: 'writing',
  },
  {
    id: 'caption-generator',
    name: 'Caption Generator',
    description: 'Social media captions with hashtags',
    placeholder: 'Describe your post, platform, and brand voice...',
    categoryId: 'writing',
  },
  {
    id: 'story-generator',
    name: 'Story Generator',
    description: 'Creative short stories from prompts',
    placeholder: 'Enter genre, characters, setting, or plot idea...',
    categoryId: 'writing',
  },
  {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Concise summaries with key takeaways',
    placeholder: 'Paste the text you want to summarize...',
    categoryId: 'text',
  },
  {
    id: 'paraphrasing-tool',
    name: 'Paraphrasing Tool',
    description: 'Rewrite text while keeping meaning',
    placeholder: 'Paste text to paraphrase...',
    categoryId: 'text',
  },
  {
    id: 'grammar-fixer',
    name: 'Grammar Fixer',
    description: 'Fix grammar, spelling, and style',
    placeholder: 'Paste text with grammar issues...',
    categoryId: 'text',
  },
  {
    id: 'tone-changer',
    name: 'Tone Changer',
    description: 'Rewrite in different tones',
    placeholder: 'Paste text and note desired tones if any...',
    categoryId: 'text',
  },
  {
    id: 'text-expander',
    name: 'Text Expander',
    description: 'Expand brief notes into detailed content',
    placeholder: 'Enter your brief text or bullet points...',
    categoryId: 'text',
  },
  {
    id: 'code-explainer',
    name: 'Code Explainer',
    description: 'Beginner-friendly code explanations',
    placeholder: 'Paste your code here...',
    categoryId: 'developer',
  },
  {
    id: 'sql-generator',
    name: 'SQL Generator',
    description: 'Generate SQL from natural language',
    placeholder: 'Describe the database query you need...',
    categoryId: 'developer',
  },
  {
    id: 'regex-generator',
    name: 'Regex Generator',
    description: 'Regular expressions with explanations',
    placeholder: 'Describe what pattern you need to match...',
    categoryId: 'developer',
  },
  {
    id: 'api-doc-generator',
    name: 'API Doc Generator',
    description: 'API documentation from specs',
    placeholder: 'Describe your API endpoint, params, and responses...',
    categoryId: 'developer',
  },
  {
    id: 'debug-helper',
    name: 'Debug Helper',
    description: 'Diagnose and fix code errors',
    placeholder: 'Paste error message and relevant code...',
    categoryId: 'developer',
  },
  {
    id: 'cold-email-generator',
    name: 'Cold Email Generator',
    description: 'High-converting outreach emails',
    placeholder: 'Describe prospect, offer, and your value prop...',
    categoryId: 'marketing',
  },
  {
    id: 'ad-copy-generator',
    name: 'Ad Copy Generator',
    description: 'Conversion-focused ad copy',
    placeholder: 'Describe product, audience, and platform...',
    categoryId: 'marketing',
  },
  {
    id: 'product-description',
    name: 'Product Description Generator',
    description: 'E-commerce product descriptions',
    placeholder: 'Describe your product features and benefits...',
    categoryId: 'marketing',
  },
  {
    id: 'landing-page-copy',
    name: 'Landing Page Copy Generator',
    description: 'Hero, benefits, and CTA copy',
    placeholder: 'Describe your product, audience, and offer...',
    categoryId: 'marketing',
  },
  {
    id: 'sales-pitch',
    name: 'Sales Pitch Generator',
    description: 'Persuasive sales pitches and scripts',
    placeholder: 'Describe product, prospect pain points, and goals...',
    categoryId: 'marketing',
  },
  {
    id: 'whatsapp-reply',
    name: 'WhatsApp Reply Generator',
    description: 'Quick professional WhatsApp replies',
    placeholder: 'Describe the conversation context and message received...',
    categoryId: 'automation',
  },
  {
    id: 'chatbot-response',
    name: 'Chatbot Response Generator',
    description: 'On-brand chatbot dialogue',
    placeholder: 'Describe your bot persona and user scenario...',
    categoryId: 'automation',
  },
  {
    id: 'lead-message',
    name: 'Lead Message Generator',
    description: 'Lead nurturing message sequences',
    placeholder: 'Describe lead source, product, and nurture goal...',
    categoryId: 'automation',
  },
  {
    id: 'faq-generator',
    name: 'FAQ Generator',
    description: 'Comprehensive FAQ sections',
    placeholder: 'Describe your product, service, or business...',
    categoryId: 'automation',
  },
  {
    id: 'support-reply',
    name: 'Support Reply Tool',
    description: 'Empathetic customer support replies',
    placeholder: 'Describe customer issue and resolution details...',
    categoryId: 'automation',
  },
  {
    id: 'startup-idea',
    name: 'Startup Idea Generator',
    description: 'Innovative and practical startup ideas',
    placeholder: 'Enter industry, skills, or problems you want to solve...',
    categoryId: 'productivity',
  },
  {
    id: 'todo-generator',
    name: 'To-Do Generator',
    description: 'Actionable task breakdowns',
    placeholder: 'Describe your project or goal...',
    categoryId: 'productivity',
  },
  {
    id: 'business-name',
    name: 'Business Name Generator',
    description: 'Creative brand name ideas',
    placeholder: 'Describe your business niche and values...',
    categoryId: 'productivity',
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar Generator',
    description: '2-week content planning calendars',
    placeholder: 'Describe niche, platforms, and content goals...',
    categoryId: 'productivity',
  },
  {
    id: 'hashtag-generator',
    name: 'Hashtag Generator',
    description: 'Optimized hashtag sets by platform',
    placeholder: 'Describe your content, niche, and target platform...',
    categoryId: 'productivity',
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}

export function getToolsByCategory(categoryId: string): Tool[] {
  return tools.filter((t) => t.categoryId === categoryId);
}
