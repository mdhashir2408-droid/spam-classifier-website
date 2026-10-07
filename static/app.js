/**
 * SpamGuard AI — Frontend Logic & 3D Interactive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const messageInput = document.getElementById('message-input');
  const clearInputBtn = document.getElementById('clear-input-btn');
  const charCounter = document.getElementById('char-counter');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resetAllBtn = document.getElementById('reset-all-btn');
  const sampleChips = document.querySelectorAll('.sample-chip');
  
  // Results
  const resultContainer = document.getElementById('result-container');
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictIconBox = document.getElementById('verdict-icon-box');
  const verdictBadge = document.getElementById('verdict-badge');
  const verdictTitle = document.getElementById('verdict-title');
  const verdictDesc = document.getElementById('verdict-desc');
  const dialPercentage = document.getElementById('dial-percentage');
  const dialCircle = document.getElementById('dial-progress-circle');
  const spamProbVal = document.getElementById('spam-prob-val');
  const spamProbBar = document.getElementById('spam-prob-bar');
  const hamProbVal = document.getElementById('ham-prob-val');
  const hamProbBar = document.getElementById('ham-prob-bar');
  const triggersSection = document.getElementById('triggers-section');
  const triggersTags = document.getElementById('triggers-tags');
  const triggersSubtitle = document.getElementById('triggers-subtitle');
  const copyResultBtn = document.getElementById('copy-result-btn');

  // History & Tilt Card
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const cardWrapper = document.getElementById('card-tilt-wrapper');
  const card = document.getElementById('classifier-card');
  const toast = document.getElementById('toast');

  let currentAnalysis = null;
  const sessionHistory = [];

  // ==========================================
  // 1. 3D Background Canvas (Constellation / Cyber Mesh)
  // ==========================================
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const PARTICLE_COUNT = 65;
  const CONNECT_DISTANCE = 130;
  let mouse = { x: null, y: null, targetX: 0, targetY: 0 };

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random() * 2 + 0.5; // 3D depth layer
      this.vx = (Math.random() - 0.5) * 0.45 * this.z;
      this.vy = (Math.random() - 0.5) * 0.45 * this.z;
      this.radius = 1.2 * this.z;
      this.color = Math.random() > 0.3 ? 'rgba(99, 102, 241, ' : 'rgba(6, 182, 212, ';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Parallax mouse shift
      if (mouse.x !== null) {
        const dx = (mouse.x - width / 2) * 0.005 * this.z;
        const dy = (mouse.y - height / 2) * 0.005 * this.z;
        this.x -= dx * 0.2;
        this.y -= dy * 0.2;
      }

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color + (0.35 * this.z) + ')';
      ctx.fill();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);

    // Draw connecting lines (Constellation Mesh)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DISTANCE) {
          const alpha = (1 - dist / CONNECT_DISTANCE) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Update & draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animateCanvas);
  }
  animateCanvas();

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // ==========================================
  // 2. 3D Card Tilt & Specular Sheen Effect
  // ==========================================
  if (cardWrapper && card) {
    cardWrapper.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalize coordinates (-1 to 1)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6; // Max 6 deg
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    cardWrapper.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  }

  // ==========================================
  // 3. Input Handling & Live Counters
  // ==========================================
  function updateCounters() {
    const text = messageInput.value;
    const charCount = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    charCounter.textContent = `${charCount} chars • ${words} words`;

    if (charCount > 0) {
      clearInputBtn.classList.add('visible');
    } else {
      clearInputBtn.classList.remove('visible');
    }
  }

  messageInput.addEventListener('input', updateCounters);

  clearInputBtn.addEventListener('click', () => {
    messageInput.value = '';
    messageInput.focus();
    updateCounters();
  });

  resetAllBtn.addEventListener('click', () => {
    messageInput.value = '';
    updateCounters();
    resultContainer.classList.add('hidden');
    currentAnalysis = null;
    showToast('Reset completed');
  });

  // Sample quick chips
  sampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleText = chip.getAttribute('data-sample');
      messageInput.value = sampleText;
      updateCounters();
      classifyMessage();
    });
  });

  // Form Submission
  const form = document.getElementById('classifier-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    classifyMessage();
  });

  // ==========================================
  // 4. API Request & Analysis Execution
  // ==========================================
  async function classifyMessage() {
    const message = messageInput.value.trim();

    if (!message) {
      showToast('⚠️ Please enter a message to analyze.');
      messageInput.focus();
      return;
    }

    // Set button loading state
    analyzeBtn.classList.add('loading');
    analyzeBtn.disabled = true;

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Evaluation failed');
      }

      const data = await response.json();
      currentAnalysis = data;
      renderResults(data);
      addToHistory(data);

    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`);
    } finally {
      analyzeBtn.classList.remove('loading');
      analyzeBtn.disabled = false;
    }
  }

  // ==========================================
  // 5. Results Rendering & Visual Feedback
  // ==========================================
  function renderResults(data) {
    const isSpam = data.is_spam;
    resultContainer.classList.remove('hidden');

    // Toggle verdict styles
    const resultBox = document.getElementById('classifier-card');
    if (isSpam) {
      resultBox.classList.remove('is-ham');
      resultBox.classList.add('is-spam');

      verdictIconBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
      verdictBadge.textContent = 'HIGH RISK ALERT';
      verdictTitle.textContent = 'Spam Detected';
      verdictDesc.textContent = 'Characteristics consistent with phishing, scams, or unsolicited marketing detected.';
    } else {
      resultBox.classList.remove('is-spam');
      resultBox.classList.add('is-ham');

      verdictIconBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      `;
      verdictBadge.textContent = 'VERIFIED CLEAN';
      verdictTitle.textContent = 'Legitimate Message';
      verdictDesc.textContent = 'Content is consistent with authentic normal communication.';
    }

    // Animate Circular Dial (circumference = 2 * PI * 42 ≈ 263.89)
    const circumference = 264;
    const confidencePct = Math.min(100, Math.max(0, data.confidence));
    const offset = circumference - (confidencePct / 100) * circumference;
    dialCircle.style.strokeDashoffset = offset;
    dialPercentage.textContent = `${data.confidence.toFixed(1)}%`;

    // Probability Bars
    spamProbVal.textContent = `${data.spam_probability.toFixed(1)}%`;
    spamProbBar.style.width = `${data.spam_probability}%`;

    hamProbVal.textContent = `${data.ham_probability.toFixed(1)}%`;
    hamProbBar.style.width = `${data.ham_probability}%`;

    // Trigger Keywords
    triggersTags.innerHTML = '';
    const hasSpamTriggers = data.spam_triggers && data.spam_triggers.length > 0;
    const hasHamTriggers = data.ham_indicators && data.ham_indicators.length > 0;

    if (hasSpamTriggers) {
      data.spam_triggers.forEach(word => {
        const tag = document.createElement('span');
        tag.className = 'trigger-tag spam-tag';
        tag.innerHTML = `⚠️ ${escapeHtml(word)}`;
        triggersTags.appendChild(tag);
      });
    }

    if (hasHamTriggers) {
      data.ham_indicators.forEach(word => {
        const tag = document.createElement('span');
        tag.className = 'trigger-tag ham-tag';
        tag.innerHTML = `✓ ${escapeHtml(word)}`;
        triggersTags.appendChild(tag);
      });
    }

    if (!hasSpamTriggers && !hasHamTriggers) {
      const tag = document.createElement('span');
      tag.className = 'trigger-tag neutral-tag';
      tag.textContent = 'General natural vocabulary';
      triggersTags.appendChild(tag);
      triggersSubtitle.textContent = 'Standard vocabulary without strong anomalous weights';
    } else {
      triggersSubtitle.textContent = `Identified ${ (data.spam_triggers?.length || 0) + (data.ham_indicators?.length || 0) } high-influence vocabulary tokens`;
    }

    // Scroll slightly so the user sees results comfortably
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ==========================================
  // 6. History Tracking
  // ==========================================
  function addToHistory(data) {
    sessionHistory.unshift(data);
    if (sessionHistory.length > 6) sessionHistory.pop();

    historySection.classList.remove('hidden');
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    sessionHistory.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.innerHTML = `
        <span class="history-text">${escapeHtml(item.message)}</span>
        <span class="history-tag ${item.is_spam ? 'spam' : 'ham'}">
          ${item.is_spam ? 'SPAM' : 'NORMAL'} (${item.confidence.toFixed(0)}%)
        </span>
      `;
      row.addEventListener('click', () => {
        messageInput.value = item.message;
        updateCounters();
        renderResults(item);
      });
      historyList.appendChild(row);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    sessionHistory.length = 0;
    historySection.classList.add('hidden');
    showToast('Scan history cleared');
  });

  // ==========================================
  // 7. Clipboard & Utilities
  // ==========================================
  copyResultBtn.addEventListener('click', () => {
    if (!currentAnalysis) return;
    const report = 
`--- SpamGuard AI Evaluation Report ---
Verdict: ${currentAnalysis.is_spam ? 'SPAM' : 'LEGITIMATE'}
Confidence: ${currentAnalysis.confidence}%
Spam Probability: ${currentAnalysis.spam_probability}%
Clean Probability: ${currentAnalysis.ham_probability}%
Trigger Tokens: ${currentAnalysis.spam_triggers.join(', ') || 'None'}
Message: "${currentAnalysis.message}"
--------------------------------------`;
    
    navigator.clipboard.writeText(report).then(() => {
      showToast('📋 Report copied to clipboard!');
    }).catch(() => {
      showToast('Could not copy report');
    });
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
});
