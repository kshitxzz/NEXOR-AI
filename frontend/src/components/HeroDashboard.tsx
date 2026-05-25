import { useEffect, useState } from 'react';
import './HeroDashboard.css';

const DEMO_STEPS = [
  { type: 'input', text: 'Write a blog about AI productivity tools...' },
  { type: 'loading', text: '' },
  { type: 'output', text: '## The Future of AI Productivity\n\nArtificial intelligence is transforming how we work...' },
];

export default function HeroDashboard() {
  const [step, setStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const current = DEMO_STEPS[step];

  useEffect(() => {
    if (current.type === 'loading') {
      const t = setTimeout(() => setStep(2), 1500);
      return () => clearTimeout(t);
    }

    if (current.type === 'output') {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayText(current.text.slice(0, i));
        if (i >= current.text.length) {
          clearInterval(interval);
          setTimeout(() => {
            setStep(0);
            setDisplayText('');
          }, 3000);
        }
      }, 20);
      return () => clearInterval(interval);
    }

    if (current.type === 'input') {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayText(current.text.slice(0, i));
        if (i >= current.text.length) {
          clearInterval(interval);
          setTimeout(() => setStep(1), 800);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [step, current]);

  return (
    <div className="hero-dashboard glass-card">
      <div className="dashboard-header">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
        <span className="dashboard-title">NexorAI Studio</span>
      </div>
      <div className="dashboard-body">
        {current.type === 'input' && (
          <div className="dashboard-input">
            <span className="label">Your prompt</span>
            <p>{displayText}<span className="cursor">|</span></p>
          </div>
        )}
        {current.type === 'loading' && (
          <div className="dashboard-loading">
            <div className="loader" />
            <span>Generating with Gemini AI...</span>
          </div>
        )}
        {current.type === 'output' && (
          <div className="dashboard-output">
            <span className="label">AI Response</span>
            <p>{displayText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
