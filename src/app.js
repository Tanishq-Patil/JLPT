// ==========================================================================
// JLPT N5 Master - Core Application Engine & State Machine
// ==========================================================================

import { JLPT_DATA, DATA_STATS } from './data.js';

// --- ROMAJI TO HIRAGANA TRANSLITERATOR ---
const ROMAJI_HIRAGANA_MAP = {
  'kya':'きゃ','kyu':'きゅ','kyo':'きょ','sha':'しゃ','shu':'しゅ','sho':'しょ',
  'cha':'ちゃ','chu':'ちゅ','cho':'ちょ','nya':'にゃ','nyu':'にゅ','nyo':'にょ',
  'hya':'ひゃ','hyu':'ひゅ','hyo':'ひょ','mya':'みゃ','myu':'みゅ','myo':'みょ',
  'rya':'りゃ','ryu':'りゅ','ryo':'りょ','gya':'ぎゃ','gyu':'ぎゅ','gyo':'ぎょ',
  'ja':'じゃ','ju':'じゅ','jo':'じょ','bya':'びゃ','byu':'びゅ','byo':'びょ',
  'pya':'ぴゃ','pyu':'ぴゅ','pyo':'ぴょ',
  'ka':'か','ki':'き','ku':'く','ke':'け','ko':'こ',
  'sa':'さ','shi':'し','si':'し','su':'す','se':'せ','so':'そ',
  'ta':'た','chi':'ち','ti':'ち','tsu':'つ','tu':'つ','te':'て','to':'と',
  'na':'な','ni':'に','nu':'ぬ','ne':'ね','no':'の',
  'ha':'は','hi':'ひ','fu':'ふ','hu':'ふ','he':'へ','ho':'ほ',
  'ma':'ま','mi':'み','mu':'む','me':'め','mo':'も',
  'ya':'や','yu':'ゆ','yo':'よ',
  'ra':'ら','ri':'り','ru':'る','re':'れ','ro':'ろ',
  'wa':'わ','wo':'を','nn':'ん','n':'ん',
  'ga':'が','gi':'ぎ','gu':'ぐ','ge':'げ','go':'ご',
  'za':'ざ','ji':'じ','zi':'じ','zu':'ず','ze':'ぜ','zo':'ぞ',
  'da':'だ','di':'ぢ','du':'づ','de':'で','do':'ど',
  'ba':'ば','bi':'び','bu':'ぶ','be':'べ','bo':'ぼ',
  'pa':'ぱ','pi':'ぴ','pu':'ぷ','pe':'ぺ','po':'ぽ',
  'a':'あ','i':'い','u':'う','e':'え','o':'お'
};

function romajiToHiragana(text) {
  let str = text.toLowerCase();
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (i + 1 < str.length && str[i] === str[i+1] && !"aeiou n".includes(str[i])) {
      result += 'っ';
      i++;
      continue;
    }
    if (i + 3 <= str.length && ROMAJI_HIRAGANA_MAP[str.slice(i, i+3)]) {
      result += ROMAJI_HIRAGANA_MAP[str.slice(i, i+3)];
      i += 3;
      continue;
    }
    if (i + 2 <= str.length && ROMAJI_HIRAGANA_MAP[str.slice(i, i+2)]) {
      result += ROMAJI_HIRAGANA_MAP[str.slice(i, i+2)];
      i += 2;
      continue;
    }
    if (ROMAJI_HIRAGANA_MAP[str[i]]) {
      result += ROMAJI_HIRAGANA_MAP[str[i]];
      i++;
      continue;
    }
    result += str[i];
    i++;
  }
  return result;
}

// --- AUDIO SYNTHESIZER (Web Audio API) ---
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error", e);
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    setTimeout(() => this.playTone(523.25, 'triangle', 0.12, 0.2), 0);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.2), 80);
    setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.25), 160);
  }

  playWrong() {
    if (!this.enabled) return;
    setTimeout(() => this.playTone(220, 'sawtooth', 0.18, 0.12), 0);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.25, 0.12), 100);
  }

  playFlip() {
    if (!this.enabled) return;
    this.playTone(400, 'sine', 0.06, 0.08);
  }

  playFanfare() {
    if (!this.enabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.25), idx * 120);
    });
  }
}

// --- TEXT-TO-SPEECH (Web Speech API) ---
class SpeechEngine {
  constructor() {
    this.japaneseVoice = null;
    this.enabled = true;
    this.initVoices();
  }

  initVoices() {
    if ('speechSynthesis' in window) {
      const load = () => {
        const voices = window.speechSynthesis.getVoices();
        this.japaneseVoice = voices.find(v => v.lang.startsWith('ja')) || null;
      };
      load();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = load;
      }
    }
  }

  speak(text) {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      if (this.japaneseVoice) {
        utterance.voice = this.japaneseVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error", e);
    }
  }
}

// --- SAKURA CANVAS PETALS ANIMATION ---
class SakuraEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.maxPetals = 28;
    this.animId = null;
    this.active = true;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initPetals();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initPetals() {
    this.petals = [];
    for (let i = 0; i < this.maxPetals; i++) {
      this.petals.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: 5 + Math.random() * 6,
        d: Math.random() * this.maxPetals,
        color: `rgba(244, 114, 182, ${0.35 + Math.random() * 0.45})`,
        tilt: Math.random() * 10 - 10,
        tiltAngleInc: (Math.random() * 0.07) + 0.02,
        tiltAngle: 0
      });
    }
  }

  draw() {
    if (!this.active || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.maxPetals; i++) {
      const p = this.petals[i];
      this.ctx.beginPath();
      this.ctx.lineWidth = p.r / 2;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + (p.r / 4), p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 4));
      this.ctx.stroke();

      p.tiltAngle += p.tiltAngleInc;
      p.y += (Math.cos(p.d) + 1 + p.r / 4) * 0.65;
      p.x += Math.sin(p.d) * 0.8;
      p.tilt = Math.sin(p.tiltAngle - (i / 3)) * 12;

      if (p.y > this.canvas.height) {
        this.petals[i].x = Math.random() * this.canvas.width;
        this.petals[i].y = -10;
      }
      if (p.x > this.canvas.width + 10) {
        this.petals[i].x = -10;
      } else if (p.x < -10) {
        this.petals[i].x = this.canvas.width + 10;
      }
    }
    this.animId = requestAnimationFrame(() => this.draw());
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      this.draw();
    } else {
      if (this.animId) cancelAnimationFrame(this.animId);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    return this.active;
  }
}

// --- MAIN APPLICATION STATE ---
class JLPTApp {
  constructor() {
    this.audio = new AudioEngine();
    this.speech = new SpeechEngine();
    this.sakura = new SakuraEffect('sakuraCanvas');

    // Persistence
    this.loadState();

    // Current View: 'adjectives' | 'verbs' | 'mixed' | 'active-quiz' | 'drill' | 'flashcards' | 'match' | 'dict'
    this.currentView = 'adjectives';
    this.lastTestCategory = 'adjectives';

    // Active Quiz Session
    this.quizSession = {
      active: false,
      testTitle: 'Test',
      pool: [],
      questions: [],
      currentIndex: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      timerRemaining: 15,
      timerInterval: null,
      timerMode: 'none',
      autoAudio: false,
      history: []
    };

    // Conjugation Drill Session
    this.drillSession = {
      activeForms: ['masu', 'nai', 'te', 'ta', 'tai', 'takunai'],
      currentVerb: null,
      targetForm: 'te',
      choices: [],
      answered: false,
      score: 0,
      total: 0
    };

    // Flashcards Session
    this.cardDeck = [];
    this.cardIndex = 0;
    this.isCardFlipped = false;

    // Match Game Session
    this.matchGame = {
      tiles: [],
      selectedTile: null,
      matchedCount: 0,
      startTime: null,
      timerId: null,
      elapsed: 0
    };

    // Cache elements & bind events
    this.cacheDOM();
    this.bindEvents();
    this.initUI();
    this.sakura.draw();
  }

  loadState() {
    this.xp = parseInt(localStorage.getItem('jlpt_xp') || '0', 10);
    this.streak = parseInt(localStorage.getItem('jlpt_streak') || '0', 10);
    this.theme = localStorage.getItem('jlpt_theme') || 'dark';
    this.soundEnabled = localStorage.getItem('jlpt_sound') !== 'false';
    this.sakuraEnabled = localStorage.getItem('jlpt_sakura') !== 'false';
    this.showFurigana = localStorage.getItem('jlpt_furigana') !== 'false';
    this.showRomaji = localStorage.getItem('jlpt_romaji') !== 'false';

    try {
      this.starred = new Set(JSON.parse(localStorage.getItem('jlpt_starred') || '[]'));
    } catch {
      this.starred = new Set();
    }

    try {
      this.mistakes = JSON.parse(localStorage.getItem('jlpt_mistakes') || '{}');
    } catch {
      this.mistakes = {};
    }

    this.audio.enabled = this.soundEnabled;
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  saveState() {
    localStorage.setItem('jlpt_xp', this.xp.toString());
    localStorage.setItem('jlpt_streak', this.streak.toString());
    localStorage.setItem('jlpt_theme', this.theme);
    localStorage.setItem('jlpt_sound', this.soundEnabled.toString());
    localStorage.setItem('jlpt_sakura', this.sakuraEnabled.toString());
    localStorage.setItem('jlpt_furigana', this.showFurigana.toString());
    localStorage.setItem('jlpt_romaji', this.showRomaji.toString());
    localStorage.setItem('jlpt_starred', JSON.stringify([...this.starred]));
    localStorage.setItem('jlpt_mistakes', JSON.stringify(this.mistakes));
  }

  cacheDOM() {
    this.dom = {
      // Header brand and stats
      brandLogo: document.getElementById('brandLogo'),
      streakDisplay: document.getElementById('streakDisplay'),
      xpDisplay: document.getElementById('xpDisplay'),
      levelDisplay: document.getElementById('levelDisplay'),

      // Header action buttons
      btnThemeToggle: document.getElementById('btnThemeToggle'),
      btnSoundToggle: document.getElementById('btnSoundToggle'),
      btnSakuraToggle: document.getElementById('btnSakuraToggle'),

      // Navigation tabs & views
      navTabs: document.querySelectorAll('.nav-tab'),
      viewSections: document.querySelectorAll('.view-section'),

      // Adjectives Test Elements
      adjDeckFilters: document.querySelectorAll('#adjDeckFilters .filter-pill'),
      adjQuestionType: document.getElementById('adjQuestionType'),
      adjQuestionCount: document.getElementById('adjQuestionCount'),
      adjTimerSelect: document.getElementById('adjTimerSelect'),
      toggleAdjFurigana: document.getElementById('toggleAdjFurigana'),
      toggleAdjRomaji: document.getElementById('toggleAdjRomaji'),
      toggleAdjAutoAudio: document.getElementById('toggleAdjAutoAudio'),
      btnStartAdjTest: document.getElementById('btnStartAdjTest'),

      // Verbs Test Elements
      verbDeckFilters: document.querySelectorAll('#verbDeckFilters .filter-pill'),
      verbSpecificEnding: document.getElementById('verbSpecificEnding'),
      verbQuestionType: document.getElementById('verbQuestionType'),
      verbQuestionCount: document.getElementById('verbQuestionCount'),
      verbTimerSelect: document.getElementById('verbTimerSelect'),
      toggleVerbFurigana: document.getElementById('toggleVerbFurigana'),
      toggleVerbRomaji: document.getElementById('toggleVerbRomaji'),
      toggleVerbAutoAudio: document.getElementById('toggleVerbAutoAudio'),
      btnStartVerbTest: document.getElementById('btnStartVerbTest'),

      // Mixed Test Elements
      mixedDeckFilters: document.querySelectorAll('#mixedDeckFilters .filter-pill'),
      mixedMistakeBadge: document.getElementById('mixedMistakeBadge'),
      mixedStarredBadge: document.getElementById('mixedStarredBadge'),
      mistakeCountNum: document.getElementById('mistakeCountNum'),
      mixedQuestionType: document.getElementById('mixedQuestionType'),
      mixedQuestionCount: document.getElementById('mixedQuestionCount'),
      mixedTimerSelect: document.getElementById('mixedTimerSelect'),
      toggleMixedFurigana: document.getElementById('toggleMixedFurigana'),
      toggleMixedRomaji: document.getElementById('toggleMixedRomaji'),
      btnStartMixedTest: document.getElementById('btnStartMixedTest'),

      // Active Quiz Elements
      quizCard: document.getElementById('quizCard'),
      btnExitQuiz: document.getElementById('btnExitQuiz'),
      activeTestTitleBadge: document.getElementById('activeTestTitleBadge'),
      quizProgressFill: document.getElementById('quizProgressFill'),
      quizProgressText: document.getElementById('quizProgressText'),
      quizTimerBadge: document.getElementById('quizTimerBadge'),
      quizTimerVal: document.getElementById('quizTimerVal'),
      quizComboBadge: document.getElementById('quizComboBadge'),
      quizComboVal: document.getElementById('quizComboVal'),

      promptBadge: document.getElementById('promptBadge'),
      promptKanjiWrap: document.getElementById('promptKanjiWrap'),
      promptKanjiText: document.getElementById('promptKanjiText'),
      btnPromptAudio: document.getElementById('btnPromptAudio'),
      promptRomajiText: document.getElementById('promptRomajiText'),
      promptClueText: document.getElementById('promptClueText'),
      choicesGrid: document.getElementById('choicesGrid'),

      quizFeedbackBox: document.getElementById('quizFeedbackBox'),
      feedbackStatus: document.getElementById('feedbackStatus'),
      feedbackText: document.getElementById('feedbackText'),
      feedbackConjugations: document.getElementById('feedbackConjugations'),
      btnNextQuestion: document.getElementById('btnNextQuestion'),

      // Results view
      quizResultsBox: document.getElementById('quizResultsBox'),
      resultsRank: document.getElementById('resultsRank'),
      resultsSubMsg: document.getElementById('resultsSubMsg'),
      resultsScoreVal: document.getElementById('resultsScoreVal'),
      resultsXpVal: document.getElementById('resultsXpVal'),
      resultsStreakVal: document.getElementById('resultsStreakVal'),
      btnBackToHome: document.getElementById('btnBackToHome'),
      btnRestartQuiz: document.getElementById('btnRestartQuiz'),
      btnReviewMistakes: document.getElementById('btnReviewMistakes'),

      // Conjugation Drill Elements
      conjFormChips: document.querySelectorAll('.conj-toggle-chip'),
      drillVerbKanji: document.getElementById('drillVerbKanji'),
      drillVerbMeaning: document.getElementById('drillVerbMeaning'),
      drillTargetFormBadge: document.getElementById('drillTargetFormBadge'),
      drillChoicesGrid: document.getElementById('drillChoicesGrid'),
      drillTextInput: document.getElementById('drillTextInput'),
      drillFeedbackBox: document.getElementById('drillFeedbackBox'),
      drillFeedbackStatus: document.getElementById('drillFeedbackStatus'),
      drillFeedbackExplanation: document.getElementById('drillFeedbackExplanation'),
      btnNextDrill: document.getElementById('btnNextDrill'),

      // Flashcards Elements
      cardDeckFilter: document.getElementById('cardDeckFilter'),
      flashcardObject: document.getElementById('flashcardObject'),
      cardCategoryBadge: document.getElementById('cardCategoryBadge'),
      cardStarBtn: document.getElementById('cardStarBtn'),
      cardFrontKanji: document.getElementById('cardFrontKanji'),
      cardFrontRomaji: document.getElementById('cardFrontRomaji'),
      cardFrontFurigana: document.getElementById('cardFrontFurigana'),
      cardMeaningBack: document.getElementById('cardMeaningBack'),
      cardBackConjugations: document.getElementById('cardBackConjugations'),
      cardCounter: document.getElementById('cardCounter'),
      btnCardPrev: document.getElementById('btnCardPrev'),
      btnCardFlip: document.getElementById('btnCardFlip'),
      btnCardNext: document.getElementById('btnCardNext'),
      btnCardAudio: document.getElementById('btnCardAudio'),
      rateBtns: document.querySelectorAll('.rate-btn'),

      // Match Game Elements
      matchGrid: document.getElementById('matchGrid'),
      matchTimerVal: document.getElementById('matchTimerVal'),
      matchPairsLeft: document.getElementById('matchPairsLeft'),
      btnResetMatch: document.getElementById('btnResetMatch'),

      // Dictionary Elements
      dictSearchInput: document.getElementById('dictSearchInput'),
      dictFilterPills: document.querySelectorAll('#dictFilters .filter-pill'),
      dictGrid: document.getElementById('dictGrid'),
      dictCountBadge: document.getElementById('dictCountBadge'),

      // Modal
      conjModal: document.getElementById('conjModal'),
      modalTitle: document.getElementById('modalTitle'),
      modalBody: document.getElementById('modalBody'),
      btnModalClose: document.getElementById('btnModalClose')
    };
  }

  bindEvents() {
    // Brand click: Return to Main Menu / Adjectives Test
    this.dom.brandLogo.addEventListener('click', () => this.backToHome());

    // Top Bar Actions
    this.dom.btnThemeToggle.addEventListener('click', () => this.toggleTheme());
    this.dom.btnSoundToggle.addEventListener('click', () => this.toggleSound());
    this.dom.btnSakuraToggle.addEventListener('click', () => this.toggleSakura());

    // Tab Navigation
    this.dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // 1. ADJECTIVES TEST LAUNCHER
    this.dom.adjDeckFilters.forEach(pill => {
      pill.addEventListener('click', () => {
        this.dom.adjDeckFilters.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
    this.dom.btnStartAdjTest.addEventListener('click', () => this.startAdjectivesTest());

    // 2. VERBS TEST LAUNCHER
    this.dom.verbDeckFilters.forEach(pill => {
      pill.addEventListener('click', () => {
        this.dom.verbDeckFilters.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
    this.dom.btnStartVerbTest.addEventListener('click', () => this.startVerbsTest());

    // 3. MIXED TEST LAUNCHER
    this.dom.mixedDeckFilters.forEach(pill => {
      pill.addEventListener('click', () => {
        this.dom.mixedDeckFilters.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
    this.dom.btnStartMixedTest.addEventListener('click', () => this.startMixedTest());

    // ACTIVE TEST CONTROLS & NAVIGATION
    this.dom.btnExitQuiz.addEventListener('click', () => this.exitTest());
    this.dom.btnBackToHome.addEventListener('click', () => this.backToHome());
    this.dom.btnNextQuestion.addEventListener('click', () => this.nextQuestion());

    this.dom.btnRestartQuiz.addEventListener('click', () => {
      if (this.quizSession.lastStartFunc) {
        this.quizSession.lastStartFunc();
      } else {
        this.startAdjectivesTest();
      }
    });

    this.dom.btnReviewMistakes.addEventListener('click', () => {
      const mistakeIds = Object.keys(this.mistakes);
      if (mistakeIds.length === 0) {
        alert("Awesome! You currently have zero recorded mistakes.");
        return;
      }
      const mistakePool = JLPT_DATA.filter(i => mistakeIds.includes(i.id));
      this.lastTestCategory = 'mixed';
      this.launchQuizSession({
        title: '⚠️ Review Mistakes Test',
        pool: mistakePool,
        qType: 'mixed',
        count: mistakePool.length,
        timerMode: 'none',
        furigana: true,
        romaji: true,
        autoAudio: false,
        startFunc: () => this.dom.btnReviewMistakes.click()
      });
    });

    this.dom.btnPromptAudio.addEventListener('click', () => {
      const curQ = this.quizSession.questions[this.quizSession.currentIndex];
      if (curQ) {
        this.speech.speak(curQ.item.furigana);
      }
    });

    // Conjugation Drill Form Chips
    this.dom.conjFormChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const form = chip.getAttribute('data-form');
        chip.classList.toggle('active');
        if (chip.classList.contains('active')) {
          if (!this.drillSession.activeForms.includes(form)) {
            this.drillSession.activeForms.push(form);
          }
        } else {
          this.drillSession.activeForms = this.drillSession.activeForms.filter(f => f !== form);
          if (this.drillSession.activeForms.length === 0) {
            chip.classList.add('active');
            this.drillSession.activeForms.push(form);
          }
        }
        this.loadNextDrill();
      });
    });

    this.dom.btnNextDrill.addEventListener('click', () => this.loadNextDrill());

    // Drill Text Input (Romaji auto-conversion)
    this.dom.drillTextInput.addEventListener('input', (e) => {
      const converted = romajiToHiragana(e.target.value);
      if (converted !== e.target.value) {
        e.target.value = converted;
      }
    });

    this.dom.drillTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.checkDrillInput(e.target.value.trim());
      }
    });

    // Flashcard Interactions
    this.dom.flashcardObject.addEventListener('click', (e) => {
      if (e.target.closest('.card-star-btn') || e.target.closest('.audio-trigger-btn')) return;
      this.flipCard();
    });

    this.dom.btnCardFlip.addEventListener('click', () => this.flipCard());
    this.dom.btnCardPrev.addEventListener('click', () => this.prevCard());
    this.dom.btnCardNext.addEventListener('click', () => this.nextCard());

    this.dom.cardStarBtn.addEventListener('click', () => {
      const current = this.cardDeck[this.cardIndex];
      if (!current) return;
      this.toggleStar(current.id);
      this.dom.cardStarBtn.classList.toggle('starred', this.starred.has(current.id));
    });

    this.dom.btnCardAudio.addEventListener('click', () => {
      const current = this.cardDeck[this.cardIndex];
      if (current) this.speech.speak(current.furigana);
    });

    this.dom.cardDeckFilter.addEventListener('change', (e) => {
      this.initFlashcardDeck(e.target.value);
    });

    this.dom.rateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.getAttribute('data-rating');
        this.rateCard(rating);
      });
    });

    // Match Game
    this.dom.btnResetMatch.addEventListener('click', () => this.startMatchGame());

    // Dictionary Search & Filter
    this.dom.dictSearchInput.addEventListener('input', () => this.renderDictionary());
    this.dom.dictFilterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.dom.dictFilterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderDictionary();
      });
    });

    // Modal Close
    this.dom.btnModalClose.addEventListener('click', () => {
      this.dom.conjModal.classList.remove('active');
    });

    this.dom.conjModal.addEventListener('click', (e) => {
      if (e.target === this.dom.conjModal) {
        this.dom.conjModal.classList.remove('active');
      }
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
        return;
      }

      if (this.currentView === 'active-quiz' && this.quizSession.active) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          const btns = this.dom.choicesGrid.querySelectorAll('.choice-btn');
          if (btns[idx] && !btns[idx].disabled) {
            btns[idx].click();
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (this.dom.btnNextQuestion.offsetParent !== null) {
            this.dom.btnNextQuestion.click();
          }
        }
      } else if (this.currentView === 'flashcards') {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          this.flipCard();
        } else if (e.key === 'ArrowRight') {
          this.nextCard();
        } else if (e.key === 'ArrowLeft') {
          this.prevCard();
        } else if (e.key === '1') {
          this.rateCard('hard');
        } else if (e.key === '2') {
          this.rateCard('good');
        } else if (e.key === '3') {
          this.rateCard('easy');
        }
      }
    });
  }

  initUI() {
    this.updateUserStatsDisplay();
    this.updateMistakeCountBadge();
    this.renderDictionary();
    this.initFlashcardDeck('all');
    this.loadNextDrill();
  }

  updateUserStatsDisplay() {
    this.dom.streakDisplay.textContent = this.streak;
    this.dom.xpDisplay.textContent = this.xp;
    const level = Math.floor(this.xp / 100) + 1;
    this.dom.levelDisplay.textContent = `Lv.${level}`;
  }

  updateMistakeCountBadge() {
    const mistakeCount = Object.keys(this.mistakes).length;
    if (this.dom.mistakeCountNum) {
      this.dom.mistakeCountNum.textContent = mistakeCount;
    }
    if (this.dom.mixedMistakeBadge) {
      this.dom.mixedMistakeBadge.textContent = `⚠️ ${mistakeCount} Mistakes to Review`;
    }
    if (this.dom.mixedStarredBadge) {
      this.dom.mixedStarredBadge.textContent = `⭐ ${this.starred.size} Starred Words`;
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    this.dom.btnThemeToggle.textContent = this.theme === 'dark' ? '🌙' : '☀️';
    this.saveState();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.audio.enabled = this.soundEnabled;
    this.speech.enabled = this.soundEnabled;
    this.dom.btnSoundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
    this.dom.btnSoundToggle.classList.toggle('active', this.soundEnabled);
    this.saveState();
  }

  toggleSakura() {
    this.sakuraEnabled = this.sakura.toggle();
    this.dom.btnSakuraToggle.classList.toggle('active', this.sakuraEnabled);
    this.saveState();
  }

  toggleStar(itemId) {
    if (this.starred.has(itemId)) {
      this.starred.delete(itemId);
      this.showToast('Removed from Starred');
    } else {
      this.starred.add(itemId);
      this.showToast('⭐ Added to Starred Deck');
    }
    this.saveState();
    this.updateMistakeCountBadge();
    this.renderDictionary();
  }

  showToast(msg) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  switchView(viewName) {
    // If active quiz is running and switching away, stop timer
    if (this.quizSession.active && viewName !== 'active-quiz') {
      clearInterval(this.quizSession.timerInterval);
      this.quizSession.active = false;
    }

    this.currentView = viewName;

    // Update Nav Tabs
    this.dom.navTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-view') === viewName);
    });

    // Update Sections
    this.dom.viewSections.forEach(s => {
      s.classList.toggle('active', s.id === `view-${viewName}`);
    });

    if (viewName === 'match' && this.matchGame.tiles.length === 0) {
      this.startMatchGame();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // 1. DEDICATED ADJECTIVES TEST LAUNCHER
  // ==========================================================================
  startAdjectivesTest() {
    this.lastTestCategory = 'adjectives';

    const activePill = document.querySelector('#adjDeckFilters .filter-pill.active');
    const filter = activePill ? activePill.getAttribute('data-filter') : 'all_adj';

    let pool = [];
    if (filter === 'i_adj') {
      pool = JLPT_DATA.filter(i => i.type === 'i-adjective');
    } else if (filter === 'na_adj') {
      pool = JLPT_DATA.filter(i => i.type === 'na-adjective');
    } else {
      pool = JLPT_DATA.filter(i => i.type.includes('adjective'));
    }

    const qType = this.dom.adjQuestionType.value;
    const countVal = this.dom.adjQuestionCount.value;
    const count = countVal === 'all' ? pool.length : parseInt(countVal, 10);
    const timerMode = this.dom.adjTimerSelect.value;
    const furigana = this.dom.toggleAdjFurigana.checked;
    const romaji = this.dom.toggleAdjRomaji.checked;
    const autoAudio = this.dom.toggleAdjAutoAudio.checked;

    const deckLabels = {
      all_adj: '🌸 All Adjectives Test (89)',
      i_adj: '🌸 い-Adjectives Test (54)',
      na_adj: '🌿 な-Adjectives Test (35)'
    };

    this.launchQuizSession({
      title: deckLabels[filter] || '🌸 Adjectives Test',
      pool,
      qType,
      count,
      timerMode,
      furigana,
      romaji,
      autoAudio,
      startFunc: () => this.startAdjectivesTest()
    });
  }

  // ==========================================================================
  // 2. DEDICATED VERBS TEST LAUNCHER
  // ==========================================================================
  startVerbsTest() {
    this.lastTestCategory = 'verbs';

    const activePill = document.querySelector('#verbDeckFilters .filter-pill.active');
    const subGroup = activePill ? activePill.getAttribute('data-sub') : 'all';
    const ending = this.dom.verbSpecificEnding.value;

    let pool = JLPT_DATA.filter(i => i.type.includes('verb'));
    if (subGroup === 'godan') pool = pool.filter(i => i.group === 'godan');
    else if (subGroup === 'ichidan') pool = pool.filter(i => i.group === 'ichidan');
    else if (subGroup === 'irregular') pool = pool.filter(i => i.group === 'irregular');

    if (ending && ending !== 'all') {
      pool = pool.filter(i => i.subCategory === ending);
    }

    if (pool.length < 4) {
      alert("Not enough verbs found matching this filter. Please choose another subgroup.");
      return;
    }

    const qType = this.dom.verbQuestionType.value;
    const countVal = this.dom.verbQuestionCount.value;
    const count = countVal === 'all' ? pool.length : parseInt(countVal, 10);
    const timerMode = this.dom.verbTimerSelect.value;
    const furigana = this.dom.toggleVerbFurigana.checked;
    const romaji = this.dom.toggleVerbRomaji.checked;
    const autoAudio = this.dom.toggleVerbAutoAudio.checked;

    const groupLabels = {
      all: '⚡ All Verbs Master Test (115)',
      godan: '⚔️ Godan (Group 1) Verbs Test',
      ichidan: '🛡️ Ichidan (Group 2) Verbs Test',
      irregular: '⚡ Irregular Verbs Test'
    };

    this.launchQuizSession({
      title: ending !== 'all' ? `⚡ Verbs (${ending}) Test` : (groupLabels[subGroup] || '⚡ Verbs Test'),
      pool,
      qType,
      count,
      timerMode,
      furigana,
      romaji,
      autoAudio,
      startFunc: () => this.startVerbsTest()
    });
  }

  // ==========================================================================
  // 3. MIXED CHALLENGE / MISTAKES TEST LAUNCHER
  // ==========================================================================
  startMixedTest() {
    this.lastTestCategory = 'mixed';

    const activePill = document.querySelector('#mixedDeckFilters .filter-pill.active');
    const poolType = activePill ? activePill.getAttribute('data-pool') : 'all';

    let pool = [];
    if (poolType === 'mistakes') {
      const mistakeIds = Object.keys(this.mistakes);
      if (mistakeIds.length === 0) {
        alert("You have zero recorded mistakes! Practice an Adjectives or Verbs test first.");
        return;
      }
      pool = JLPT_DATA.filter(i => mistakeIds.includes(i.id));
    } else if (poolType === 'starred') {
      if (this.starred.size === 0) {
        alert("You haven't starred any words yet! Click the star icon on any word to create a custom deck.");
        return;
      }
      pool = JLPT_DATA.filter(i => this.starred.has(i.id));
    } else {
      pool = [...JLPT_DATA];
    }

    const qType = this.dom.mixedQuestionType.value;
    const countVal = this.dom.mixedQuestionCount.value;
    const count = countVal === 'all' ? pool.length : parseInt(countVal, 10);
    const timerMode = this.dom.mixedTimerSelect.value;
    const furigana = this.dom.toggleMixedFurigana.checked;
    const romaji = this.dom.toggleMixedRomaji.checked;

    const titles = {
      all: '🎯 JLPT N5 Full Mixed Challenge (204)',
      mistakes: '⚠️ Review Mistakes Test',
      starred: '⭐ Starred Words Test'
    };

    this.launchQuizSession({
      title: titles[poolType] || '🎯 Mixed Test',
      pool,
      qType,
      count,
      timerMode,
      furigana,
      romaji,
      autoAudio: false,
      startFunc: () => this.startMixedTest()
    });
  }

  // ==========================================================================
  // UNIFIED TEST RUNNER & QUESTION GENERATOR
  // ==========================================================================
  launchQuizSession(config) {
    const { title, pool, qType, count, timerMode, furigana, romaji, autoAudio, startFunc } = config;

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const finalCount = Math.min(count, shuffled.length);
    const selected = shuffled.slice(0, finalCount);

    this.quizSession = {
      active: true,
      testTitle: title,
      pool,
      qType,
      questions: selected.map(item => this.buildQuestion(item, pool, qType)),
      currentIndex: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      timerRemaining: 15,
      timerInterval: null,
      timerMode,
      autoAudio,
      showFurigana: furigana,
      showRomaji: romaji,
      lastStartFunc: startFunc,
      history: []
    };

    // Update active test title badge
    this.dom.activeTestTitleBadge.textContent = title;

    // Switch to active-quiz view
    this.switchView('active-quiz');
    this.dom.quizCard.style.display = 'block';
    this.dom.quizResultsBox.style.display = 'none';

    this.renderCurrentQuestion();
  }

  buildQuestion(item, fullPool, requestedQType) {
    let qType = requestedQType;
    if (qType === 'mixed') {
      const types = ['jp_to_en', 'en_to_jp', 'reading'];
      if (item.type.includes('verb')) types.push('conjugation');
      else if (item.type.includes('adjective')) types.push('adj_form');
      qType = types[Math.floor(Math.random() * types.length)];
    }

    let promptKanji = item.kanji;
    let promptFurigana = item.furigana;
    let promptRomaji = item.romaji;
    let promptClue = '';
    let correctAnswer = '';
    let wrongPool = [];

    // CASE 1: Japanese -> English Meaning
    if (qType === 'jp_to_en') {
      promptClue = 'Select the correct English meaning:';
      correctAnswer = item.meaning;
      wrongPool = fullPool
        .filter(i => i.id !== item.id && i.meaning !== item.meaning)
        .map(i => i.meaning);
    }
    // CASE 2: English Meaning -> Japanese
    else if (qType === 'en_to_jp') {
      promptClue = `What is "${item.meaning}" in Japanese?`;
      promptKanji = item.meaning;
      promptFurigana = '';
      promptRomaji = '';
      correctAnswer = `${item.kanji} (${item.furigana})`;
      wrongPool = fullPool
        .filter(i => i.id !== item.id)
        .map(i => `${i.kanji} (${i.furigana})`);
    }
    // CASE 3: Reading (Kanji -> Hiragana)
    else if (qType === 'reading') {
      promptClue = 'Select the correct Hiragana reading:';
      correctAnswer = item.furigana;
      wrongPool = fullPool
        .filter(i => i.id !== item.id && i.furigana !== item.furigana)
        .map(i => i.furigana);
    }
    // CASE 4: Adjective Forms (Negative, Past, Te-form)
    else if (qType === 'adj_form' && item.conjugations) {
      if (item.type === 'i-adjective') {
        const formKeys = ['negative', 'past', 'te_form'];
        const formTitles = {
          negative: 'Negative form (～くない)',
          past: 'Past form (～かった)',
          te_form: 'Te-form (～くて)'
        };
        const chosenKey = formKeys[Math.floor(Math.random() * formKeys.length)];
        promptClue = `What is the ${formTitles[chosenKey]} of "${item.kanji}"?`;
        correctAnswer = item.conjugations[chosenKey];

        wrongPool = fullPool
          .filter(i => i.type === 'i-adjective' && i.id !== item.id && i.conjugations[chosenKey])
          .map(i => i.conjugations[chosenKey]);
      } else {
        // na-adjective
        const formKeys = ['plain_negative', 'past', 'te_form'];
        const formTitles = {
          plain_negative: 'Negative form (～じゃない)',
          past: 'Past form (～だった)',
          te_form: 'Te-form (～で)'
        };
        const chosenKey = formKeys[Math.floor(Math.random() * formKeys.length)];
        promptClue = `What is the ${formTitles[chosenKey]} of "${item.kanji}"?`;
        correctAnswer = item.conjugations[chosenKey];

        wrongPool = fullPool
          .filter(i => i.type === 'na-adjective' && i.id !== item.id && i.conjugations[chosenKey])
          .map(i => i.conjugations[chosenKey]);
      }
    }
    // CASE 5: Verb Conjugations
    else if (qType === 'conjugation' && item.type.includes('verb') && item.conjugations) {
      const forms = ['masu', 'nai', 'te', 'ta', 'tai', 'takunai'];
      const targetForm = forms[Math.floor(Math.random() * forms.length)];
      const formLabels = {
        masu: '～ます (Polite Affirmative)',
        nai: '～ない (Plain Negative)',
        te: '～て (Te-form / Request)',
        ta: '～た (Plain Past)',
        tai: '～たい (Desire)',
        takunai: '～たくない (Negative Desire)'
      };
      promptClue = `What is the ${formLabels[targetForm]} of "${item.kanji}"?`;
      correctAnswer = item.conjugations[targetForm];

      wrongPool = fullPool
        .filter(i => i.type.includes('verb') && i.id !== item.id && i.conjugations[targetForm])
        .map(i => i.conjugations[targetForm]);
    }
    // Fallback
    else {
      promptClue = 'Select the correct English meaning:';
      correctAnswer = item.meaning;
      wrongPool = fullPool
        .filter(i => i.id !== item.id)
        .map(i => i.meaning);
    }

    const shuffledWrong = [...new Set(wrongPool)].sort(() => 0.5 - Math.random()).slice(0, 3);
    const choices = [...shuffledWrong, correctAnswer].sort(() => 0.5 - Math.random());

    return {
      item,
      qType,
      promptKanji,
      promptFurigana,
      promptRomaji,
      promptClue,
      correctAnswer,
      choices,
      userAnswer: null,
      isCorrect: false
    };
  }

  renderCurrentQuestion() {
    const q = this.quizSession.questions[this.quizSession.currentIndex];
    if (!q) {
      this.finishQuiz();
      return;
    }

    // Progress display
    const total = this.quizSession.questions.length;
    const curNum = this.quizSession.currentIndex + 1;
    this.dom.quizProgressText.innerHTML = `Question <span>${curNum} of ${total}</span>`;
    const pct = ((curNum - 1) / total) * 100;
    this.dom.quizProgressFill.style.width = `${pct}%`;

    // Streak / Combo
    if (this.quizSession.streak > 1) {
      this.dom.quizComboBadge.style.display = 'flex';
      this.dom.quizComboVal.textContent = `Combo x${this.quizSession.streak}!`;
    } else {
      this.dom.quizComboBadge.style.display = 'none';
    }

    // Prompt presentation
    this.dom.promptBadge.textContent = q.item.categoryLabel;

    if (q.promptFurigana && q.promptKanji !== q.promptFurigana) {
      this.dom.promptKanjiText.innerHTML = `<ruby>${q.promptKanji}<rt>${q.promptFurigana}</rt></ruby>`;
    } else {
      this.dom.promptKanjiText.textContent = q.promptKanji;
    }

    // Toggles for active session
    if (this.quizSession.showFurigana) {
      this.dom.promptKanjiText.classList.remove('hide-furigana');
    } else {
      this.dom.promptKanjiText.classList.add('hide-furigana');
    }

    this.dom.promptRomajiText.style.display = this.quizSession.showRomaji ? 'block' : 'none';
    this.dom.promptRomajiText.textContent = q.promptRomaji;
    this.dom.promptClueText.textContent = q.promptClue;

    // Auto pronunciation
    if (this.quizSession.autoAudio && q.item.furigana) {
      this.speech.speak(q.item.furigana);
    }

    // Render Choices
    this.dom.choicesGrid.innerHTML = '';
    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.setAttribute('data-choice', choice);
      btn.innerHTML = `
        <span class="choice-key">${idx + 1}</span>
        <span class="choice-text">${choice}</span>
      `;
      btn.addEventListener('click', () => this.handleAnswer(choice, btn));
      this.dom.choicesGrid.appendChild(btn);
    });

    // Reset feedback
    this.dom.quizFeedbackBox.classList.remove('active');
    this.dom.feedbackConjugations.innerHTML = '';

    // Timer
    if (this.quizSession.timerMode === '15s') {
      this.dom.quizTimerBadge.style.display = 'flex';
      this.startQuestionTimer();
    } else {
      this.dom.quizTimerBadge.style.display = 'none';
    }
  }

  startQuestionTimer() {
    clearInterval(this.quizSession.timerInterval);
    this.quizSession.timerRemaining = 15;
    this.dom.quizTimerVal.textContent = `${this.quizSession.timerRemaining}s`;

    this.quizSession.timerInterval = setInterval(() => {
      this.quizSession.timerRemaining--;
      this.dom.quizTimerVal.textContent = `${this.quizSession.timerRemaining}s`;

      if (this.quizSession.timerRemaining <= 0) {
        clearInterval(this.quizSession.timerInterval);
        this.handleTimeout();
      }
    }, 1000);
  }

  handleTimeout() {
    this.handleAnswer('__TIMEOUT__', null);
  }

  handleAnswer(selectedAnswer, clickedBtn) {
    clearInterval(this.quizSession.timerInterval);

    const q = this.quizSession.questions[this.quizSession.currentIndex];
    const isCorrect = selectedAnswer === q.correctAnswer;
    q.userAnswer = selectedAnswer;
    q.isCorrect = isCorrect;

    const buttons = this.dom.choicesGrid.querySelectorAll('.choice-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      const val = btn.getAttribute('data-choice');
      if (val === q.correctAnswer) {
        btn.classList.add('correct');
      } else if (btn === clickedBtn && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    if (isCorrect) {
      this.audio.playCorrect();
      this.quizSession.score++;
      this.quizSession.streak++;
      if (this.quizSession.streak > this.quizSession.maxStreak) {
        this.quizSession.maxStreak = this.quizSession.streak;
      }

      const earnedXp = 10 + Math.min(20, this.quizSession.streak * 2);
      this.xp += earnedXp;

      if (this.mistakes[q.item.id]) {
        delete this.mistakes[q.item.id];
      }
    } else {
      this.audio.playWrong();
      this.quizSession.streak = 0;
      this.mistakes[q.item.id] = (this.mistakes[q.item.id] || 0) + 1;
    }

    this.streak = Math.max(this.streak, this.quizSession.streak);
    this.saveState();
    this.updateUserStatsDisplay();
    this.updateMistakeCountBadge();

    this.showQuizFeedback(q, isCorrect);
  }

  showQuizFeedback(q, isCorrect) {
    this.dom.quizFeedbackBox.classList.add('active');

    this.dom.feedbackStatus.className = `feedback-status ${isCorrect ? 'correct' : 'wrong'}`;
    this.dom.feedbackStatus.innerHTML = isCorrect
      ? '✓ 正解！ Excellent! +XP'
      : '✕ 残念！ Not quite!';

    let detailsHtml = `
      <div><strong>Word:</strong> ${q.item.kanji} (${q.item.furigana}) • <em>${q.item.romaji}</em></div>
      <div><strong>Meaning:</strong> ${q.item.meaning}</div>
      <div><strong>Correct Answer:</strong> <span style="color:var(--emerald-400);font-weight:700;">${q.correctAnswer}</span></div>
    `;
    this.dom.feedbackText.innerHTML = detailsHtml;

    if (q.item.conjugations) {
      const c = q.item.conjugations;
      let strip = '';
      if (q.item.type.includes('verb')) {
        strip = `
          <div class="conj-pill"><span>辞書:</span> ${c.dictionary}</div>
          <div class="conj-pill"><span>ます:</span> ${c.masu}</div>
          <div class="conj-pill"><span>ない:</span> ${c.nai}</div>
          <div class="conj-pill"><span>て:</span> ${c.te}</div>
          <div class="conj-pill"><span>た:</span> ${c.ta}</div>
          <div class="conj-pill"><span>たい:</span> ${c.tai}</div>
        `;
      } else if (q.item.type === 'i-adjective') {
        strip = `
          <div class="conj-pill"><span>原形:</span> ${c.plain}</div>
          <div class="conj-pill"><span>否定:</span> ${c.negative}</div>
          <div class="conj-pill"><span>過去:</span> ${c.past}</div>
          <div class="conj-pill"><span>て形:</span> ${c.te_form}</div>
        `;
      } else if (q.item.type === 'na-adjective') {
        strip = `
          <div class="conj-pill"><span>修飾:</span> ${c.noun_modifier}</div>
          <div class="conj-pill"><span>肯定:</span> ${c.polite_affirmative}</div>
          <div class="conj-pill"><span>否定:</span> ${c.plain_negative}</div>
          <div class="conj-pill"><span>過去:</span> ${c.past}</div>
        `;
      }
      this.dom.feedbackConjugations.innerHTML = strip;
    }
  }

  nextQuestion() {
    this.quizSession.currentIndex++;
    if (this.quizSession.currentIndex >= this.quizSession.questions.length) {
      this.finishQuiz();
    } else {
      this.renderCurrentQuestion();
    }
  }

  finishQuiz() {
    this.quizSession.active = false;
    clearInterval(this.quizSession.timerInterval);

    this.dom.quizCard.style.display = 'none';
    this.dom.quizResultsBox.style.display = 'block';

    const total = this.quizSession.questions.length;
    const score = this.quizSession.score;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;

    let rank = 'C';
    if (pct === 100) rank = 'S+';
    else if (pct >= 90) rank = 'S';
    else if (pct >= 80) rank = 'A';
    else if (pct >= 70) rank = 'B';

    this.dom.resultsRank.textContent = rank;
    this.dom.resultsScoreVal.textContent = `${score} / ${total} (${pct}%)`;
    this.dom.resultsXpVal.textContent = `+${score * 12} XP`;
    this.dom.resultsStreakVal.textContent = `${this.quizSession.maxStreak} 🔥`;
    this.dom.resultsSubMsg.textContent = `Completed ${this.quizSession.testTitle}. Keep practicing daily for JLPT N5!`;

    if (pct >= 80) {
      this.audio.playFanfare();
    }
  }

  // Back to Main Menu / Exit Test Methods
  exitTest() {
    if (this.quizSession.timerInterval) {
      clearInterval(this.quizSession.timerInterval);
    }
    this.quizSession.active = false;
    this.dom.quizCard.style.display = 'none';
    this.dom.quizResultsBox.style.display = 'none';

    // Switch back to last selected test category
    this.switchView(this.lastTestCategory || 'adjectives');
    this.showToast('Returned to Test Menu');
  }

  backToHome() {
    if (this.quizSession.timerInterval) {
      clearInterval(this.quizSession.timerInterval);
    }
    this.quizSession.active = false;
    this.dom.quizCard.style.display = 'none';
    this.dom.quizResultsBox.style.display = 'none';

    this.switchView(this.lastTestCategory || 'adjectives');
    this.showToast('Returned to Main Menu');
  }

  // ==========================================================================
  // CONJUGATION DRILL ENGINE
  // ==========================================================================
  loadNextDrill() {
    const verbs = JLPT_DATA.filter(i => i.type.includes('verb'));
    if (!verbs.length) return;

    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const activeForms = this.drillSession.activeForms;
    const targetForm = activeForms[Math.floor(Math.random() * activeForms.length)] || 'te';

    this.drillSession.currentVerb = randomVerb;
    this.drillSession.targetForm = targetForm;
    this.drillSession.answered = false;

    const formTitles = {
      masu: '～ます (Polite Affirmative)',
      nai: '～ない (Plain Negative)',
      te: '～て (Te-form / Request)',
      ta: '～た (Plain Past)',
      tai: '～たい (Desire)',
      takunai: '～たくない (Negative Desire)'
    };

    this.dom.drillVerbKanji.innerHTML = `<ruby>${randomVerb.kanji}<rt>${randomVerb.furigana}</rt></ruby>`;
    this.dom.drillVerbMeaning.textContent = `${randomVerb.meaning} • ${randomVerb.categoryLabel}`;
    this.dom.drillTargetFormBadge.textContent = formTitles[targetForm];

    this.dom.drillTextInput.value = '';
    this.dom.drillTextInput.disabled = false;
    this.dom.drillFeedbackBox.classList.remove('active');

    const correctAnswer = randomVerb.conjugations[targetForm];
    const wrongOptions = verbs
      .filter(v => v.id !== randomVerb.id && v.conjugations[targetForm])
      .map(v => v.conjugations[targetForm])
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const choices = [...wrongOptions, correctAnswer].sort(() => 0.5 - Math.random());
    this.dom.drillChoicesGrid.innerHTML = '';
    choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerHTML = `<span class="choice-text">${ch}</span>`;
      btn.addEventListener('click', () => this.checkDrillChoice(ch, correctAnswer, btn));
      this.dom.drillChoicesGrid.appendChild(btn);
    });
  }

  checkDrillChoice(choice, correct, clickedBtn) {
    if (this.drillSession.answered) return;
    this.drillSession.answered = true;

    const isCorrect = choice === correct;
    const buttons = this.dom.drillChoicesGrid.querySelectorAll('.choice-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.querySelector('.choice-text').textContent === correct) {
        btn.classList.add('correct');
      } else if (btn === clickedBtn && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    this.showDrillResult(isCorrect, correct);
  }

  checkDrillInput(text) {
    if (this.drillSession.answered) return;
    const correct = this.drillSession.currentVerb.conjugations[this.drillSession.targetForm];
    const isCorrect = text === correct;
    this.drillSession.answered = true;
    this.dom.drillTextInput.disabled = true;

    this.showDrillResult(isCorrect, correct);
  }

  showDrillResult(isCorrect, correct) {
    const verb = this.drillSession.currentVerb;
    this.dom.drillFeedbackBox.classList.add('active');

    if (isCorrect) {
      this.audio.playCorrect();
      this.xp += 15;
      this.dom.drillFeedbackStatus.className = 'feedback-status correct';
      this.dom.drillFeedbackStatus.innerHTML = '✓ Perfect Conjugation! +15 XP';
    } else {
      this.audio.playWrong();
      this.dom.drillFeedbackStatus.className = 'feedback-status wrong';
      this.dom.drillFeedbackStatus.innerHTML = '✕ Incorrect Form';
    }

    this.saveState();
    this.updateUserStatsDisplay();

    let ruleNote = '';
    if (verb.group === 'godan') {
      ruleNote = `Group 1 (Godan verb) ending in "${verb.subCategory}".`;
    } else if (verb.group === 'ichidan') {
      ruleNote = 'Group 2 (Ichidan verb): Drop "る" and attach the suffix.';
    } else {
      ruleNote = 'Group 3 (Irregular verb): Special unique conjugation pattern.';
    }

    this.dom.drillFeedbackExplanation.innerHTML = `
      <div><strong>Correct Form:</strong> <span style="color:var(--emerald-400);font-size:1.15rem;font-weight:700;">${correct}</span></div>
      <div style="margin-top:0.35rem;color:var(--text-muted);font-size:0.85rem;">${ruleNote}</div>
    `;
  }

  // ==========================================================================
  // FLASHCARDS (3D SRS DECK)
  // ==========================================================================
  initFlashcardDeck(filter = 'all') {
    let pool = [...JLPT_DATA];
    if (filter === 'verbs') pool = pool.filter(i => i.type.includes('verb'));
    else if (filter === 'i_adj') pool = pool.filter(i => i.type === 'i-adjective');
    else if (filter === 'na_adj') pool = pool.filter(i => i.type === 'na-adjective');
    else if (filter === 'starred') pool = pool.filter(i => this.starred.has(i.id));

    this.cardDeck = pool.sort(() => 0.5 - Math.random());
    this.cardIndex = 0;
    this.isCardFlipped = false;
    this.dom.flashcardObject.classList.remove('is-flipped');
    this.renderCurrentCard();
  }

  renderCurrentCard() {
    if (!this.cardDeck.length) {
      this.dom.cardFrontKanji.textContent = 'No cards found';
      this.dom.cardCounter.textContent = '0 / 0';
      return;
    }

    const item = this.cardDeck[this.cardIndex];
    this.isCardFlipped = false;
    this.dom.flashcardObject.classList.remove('is-flipped');

    this.dom.cardCounter.textContent = `${this.cardIndex + 1} / ${this.cardDeck.length}`;
    this.dom.cardCategoryBadge.textContent = item.categoryLabel;
    this.dom.cardStarBtn.classList.toggle('starred', this.starred.has(item.id));

    if (item.kanji !== item.furigana) {
      this.dom.cardFrontKanji.innerHTML = `<ruby>${item.kanji}<rt>${item.furigana}</rt></ruby>`;
    } else {
      this.dom.cardFrontKanji.textContent = item.kanji;
    }

    this.dom.cardFrontFurigana.textContent = item.furigana;
    this.dom.cardFrontRomaji.textContent = item.romaji;
    this.dom.cardMeaningBack.textContent = item.meaning;

    this.dom.cardBackConjugations.innerHTML = '';
    if (item.conjugations) {
      if (item.type.includes('verb')) {
        const c = item.conjugations;
        this.dom.cardBackConjugations.innerHTML = `
          <div class="card-conj-box"><span class="box-lbl">ます</span><span class="box-val">${c.masu}</span></div>
          <div class="card-conj-box"><span class="box-lbl">ない</span><span class="box-val">${c.nai}</span></div>
          <div class="card-conj-box"><span class="box-lbl">て形</span><span class="box-val">${c.te}</span></div>
          <div class="card-conj-box"><span class="box-lbl">た形</span><span class="box-val">${c.ta}</span></div>
          <div class="card-conj-box"><span class="box-lbl">たい</span><span class="box-val">${c.tai}</span></div>
          <div class="card-conj-box"><span class="box-lbl">たくない</span><span class="box-val">${c.takunai}</span></div>
        `;
      } else if (item.type === 'i-adjective') {
        const c = item.conjugations;
        this.dom.cardBackConjugations.innerHTML = `
          <div class="card-conj-box"><span class="box-lbl">否定 (not)</span><span class="box-val">${c.negative}</span></div>
          <div class="card-conj-box"><span class="box-lbl">過去 (was)</span><span class="box-val">${c.past}</span></div>
          <div class="card-conj-box"><span class="box-lbl">て形</span><span class="box-val">${c.te_form}</span></div>
        `;
      } else if (item.type === 'na-adjective') {
        const c = item.conjugations;
        this.dom.cardBackConjugations.innerHTML = `
          <div class="card-conj-box"><span class="box-lbl">否定 (not)</span><span class="box-val">${c.plain_negative}</span></div>
          <div class="card-conj-box"><span class="box-lbl">過去 (was)</span><span class="box-val">${c.past}</span></div>
          <div class="card-conj-box"><span class="box-lbl">て形</span><span class="box-val">${c.te_form}</span></div>
        `;
      }
    }
  }

  flipCard() {
    this.isCardFlipped = !this.isCardFlipped;
    this.dom.flashcardObject.classList.toggle('is-flipped', this.isCardFlipped);
    this.audio.playFlip();
  }

  nextCard() {
    if (this.cardIndex < this.cardDeck.length - 1) {
      this.cardIndex++;
      this.renderCurrentCard();
    } else {
      this.cardIndex = 0;
      this.renderCurrentCard();
    }
  }

  prevCard() {
    if (this.cardIndex > 0) {
      this.cardIndex--;
      this.renderCurrentCard();
    }
  }

  rateCard(rating) {
    const cur = this.cardDeck[this.cardIndex];
    if (rating === 'easy') {
      this.xp += 5;
    } else if (rating === 'hard') {
      this.mistakes[cur.id] = (this.mistakes[cur.id] || 0) + 1;
    }
    this.saveState();
    this.updateUserStatsDisplay();
    this.updateMistakeCountBadge();
    this.nextCard();
  }

  // ==========================================================================
  // SPEED MATCH GAME
  // ==========================================================================
  startMatchGame() {
    clearInterval(this.matchGame.timerId);
    this.matchGame.elapsed = 0;
    this.dom.matchTimerVal.textContent = '00:00';
    this.matchGame.selectedTile = null;
    this.matchGame.matchedCount = 0;

    const pool = [...JLPT_DATA].sort(() => 0.5 - Math.random()).slice(0, 6);
    this.dom.matchPairsLeft.textContent = `6 pairs left`;

    const tiles = [];
    pool.forEach((item, idx) => {
      tiles.push({
        pairId: idx,
        type: 'jp',
        display: item.kanji,
        sub: item.furigana,
        item
      });
      tiles.push({
        pairId: idx,
        type: 'en',
        display: item.meaning,
        sub: '',
        item
      });
    });

    this.matchGame.tiles = tiles.sort(() => 0.5 - Math.random());
    this.renderMatchGrid();

    this.matchGame.startTime = Date.now();
    this.matchGame.timerId = setInterval(() => {
      this.matchGame.elapsed = Math.floor((Date.now() - this.matchGame.startTime) / 1000);
      const mins = String(Math.floor(this.matchGame.elapsed / 60)).padStart(2, '0');
      const secs = String(this.matchGame.elapsed % 60).padStart(2, '0');
      this.dom.matchTimerVal.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  renderMatchGrid() {
    this.dom.matchGrid.innerHTML = '';
    this.matchGame.tiles.forEach((tile, index) => {
      const tileEl = document.createElement('div');
      tileEl.className = 'match-tile';
      tileEl.setAttribute('data-index', index);

      if (tile.type === 'jp') {
        tileEl.innerHTML = `
          <div class="tile-jp-main">${tile.display}</div>
          <div class="tile-jp-sub">${tile.sub}</div>
        `;
      } else {
        tileEl.innerHTML = `
          <div class="tile-en-text">${tile.display}</div>
        `;
      }

      tileEl.addEventListener('click', () => this.handleMatchClick(index, tileEl));
      this.dom.matchGrid.appendChild(tileEl);
    });
  }

  handleMatchClick(index, tileEl) {
    if (tileEl.classList.contains('matched') || tileEl.classList.contains('selected')) return;

    const clickedTile = this.matchGame.tiles[index];

    if (!this.matchGame.selectedTile) {
      this.matchGame.selectedTile = { index, tile: clickedTile, el: tileEl };
      tileEl.classList.add('selected');
      this.audio.playFlip();
    } else {
      const first = this.matchGame.selectedTile;
      if (first.index === index) return;

      if (first.tile.pairId === clickedTile.pairId) {
        this.audio.playCorrect();
        tileEl.classList.add('matched');
        first.el.classList.remove('selected');
        first.el.classList.add('matched');

        this.matchGame.matchedCount++;
        const remaining = 6 - this.matchGame.matchedCount;
        this.dom.matchPairsLeft.textContent = `${remaining} pairs left`;
        this.matchGame.selectedTile = null;

        if (this.matchGame.matchedCount === 6) {
          clearInterval(this.matchGame.timerId);
          this.audio.playFanfare();
          this.xp += 50;
          this.saveState();
          this.updateUserStatsDisplay();
          this.showToast(`🎉 Clear in ${this.dom.matchTimerVal.textContent}! +50 XP`);
        }
      } else {
        this.audio.playWrong();
        tileEl.classList.add('mismatch');
        first.el.classList.add('mismatch');

        setTimeout(() => {
          tileEl.classList.remove('mismatch', 'selected');
          first.el.classList.remove('mismatch', 'selected');
          this.matchGame.selectedTile = null;
        }, 500);
      }
    }
  }

  // ==========================================================================
  // MASTER DICTIONARY
  // ==========================================================================
  renderDictionary() {
    const query = (this.dom.dictSearchInput.value || '').trim().toLowerCase();
    const activePill = document.querySelector('#dictFilters .filter-pill.active');
    const filter = activePill ? activePill.getAttribute('data-filter') : 'all';

    let list = [...JLPT_DATA];

    if (filter === 'verbs') {
      list = list.filter(i => i.type.includes('verb'));
    } else if (filter === 'i_adj') {
      list = list.filter(i => i.type === 'i-adjective');
    } else if (filter === 'na_adj') {
      list = list.filter(i => i.type === 'na-adjective');
    } else if (filter === 'starred') {
      list = list.filter(i => this.starred.has(i.id));
    }

    if (query) {
      list = list.filter(i =>
        i.kanji.toLowerCase().includes(query) ||
        i.furigana.toLowerCase().includes(query) ||
        i.romaji.toLowerCase().includes(query) ||
        i.meaning.toLowerCase().includes(query)
      );
    }

    this.dom.dictCountBadge.textContent = `${list.length} items`;
    this.dom.dictGrid.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'dict-card';

      const isStarred = this.starred.has(item.id);

      card.innerHTML = `
        <div class="dict-card-top">
          <div class="dict-jp-group">
            <span class="dict-kanji">${item.kanji}</span>
            <span class="dict-furigana">${item.furigana}</span>
            <span class="dict-romaji">${item.romaji}</span>
          </div>
          <button class="icon-btn dict-audio-btn" title="Pronounce">🔊</button>
        </div>
        <div class="dict-meaning">${item.meaning}</div>
        <div class="dict-card-bottom">
          <span class="dict-type-tag">${item.categoryLabel}</span>
          <div class="dict-action-group">
            ${item.conjugations ? `<button class="secondary-btn dict-view-conj-btn" style="padding:0.25rem 0.65rem;font-size:0.75rem;">Conjugate</button>` : ''}
            <button class="icon-btn dict-star-btn ${isStarred ? 'active' : ''}" title="Star Word">${isStarred ? '★' : '☆'}</button>
          </div>
        </div>
      `;

      card.querySelector('.dict-audio-btn').addEventListener('click', () => {
        this.speech.speak(item.furigana);
      });

      card.querySelector('.dict-star-btn').addEventListener('click', (e) => {
        this.toggleStar(item.id);
        const starredNow = this.starred.has(item.id);
        e.currentTarget.classList.toggle('active', starredNow);
        e.currentTarget.textContent = starredNow ? '★' : '☆';
      });

      const conjBtn = card.querySelector('.dict-view-conj-btn');
      if (conjBtn) {
        conjBtn.addEventListener('click', () => this.openConjugationModal(item));
      }

      this.dom.dictGrid.appendChild(card);
    });
  }

  openConjugationModal(item) {
    this.dom.modalTitle.textContent = `${item.kanji} (${item.furigana}) - ${item.meaning}`;
    let html = '';

    if (item.type.includes('verb')) {
      const c = item.conjugations;
      html = `
        <p style="margin-bottom:1rem;color:var(--text-secondary);font-size:0.9rem;">
          <strong>Group:</strong> ${item.categoryLabel} • <strong>Ending:</strong> ${item.subCategory}
        </p>
        <table class="conjugation-table">
          <thead>
            <tr><th>Form / Usage</th><th>Japanese</th><th>Romaji</th></tr>
          </thead>
          <tbody>
            <tr><td>辞書形 (Dictionary)</td><td class="form-jp">${c.dictionary}</td><td>${kanaToRomajiSimple(c.dictionary)}</td></tr>
            <tr><td>～ます (Polite Present)</td><td class="form-jp">${c.masu}</td><td>${kanaToRomajiSimple(c.masu)}</td></tr>
            <tr><td>～ない (Plain Negative)</td><td class="form-jp">${c.nai}</td><td>${kanaToRomajiSimple(c.nai)}</td></tr>
            <tr><td>～て (Te-form)</td><td class="form-jp">${c.te}</td><td>${kanaToRomajiSimple(c.te)}</td></tr>
            <tr><td>～た (Plain Past)</td><td class="form-jp">${c.ta}</td><td>${kanaToRomajiSimple(c.ta)}</td></tr>
            <tr><td>～たい (Desire)</td><td class="form-jp">${c.tai}</td><td>${kanaToRomajiSimple(c.tai)}</td></tr>
            <tr><td>～たくない (Negative Desire)</td><td class="form-jp">${c.takunai}</td><td>${kanaToRomajiSimple(c.takunai)}</td></tr>
          </tbody>
        </table>
      `;
    } else if (item.type === 'i-adjective') {
      const c = item.conjugations;
      html = `
        <table class="conjugation-table">
          <thead>
            <tr><th>Form</th><th>Japanese</th></tr>
          </thead>
          <tbody>
            <tr><td>Plain Positive</td><td class="form-jp">${c.plain}</td></tr>
            <tr><td>Negative (くない)</td><td class="form-jp">${c.negative}</td></tr>
            <tr><td>Past (かった)</td><td class="form-jp">${c.past}</td></tr>
            <tr><td>Past Negative (くなかった)</td><td class="form-jp">${c.past_negative}</td></tr>
            <tr><td>Te-form (くて)</td><td class="form-jp">${c.te_form}</td></tr>
            <tr><td>Adverbial (く)</td><td class="form-jp">${c.adverb}</td></tr>
          </tbody>
        </table>
      `;
    } else if (item.type === 'na-adjective') {
      const c = item.conjugations;
      html = `
        <table class="conjugation-table">
          <thead>
            <tr><th>Form</th><th>Japanese</th></tr>
          </thead>
          <tbody>
            <tr><td>With Noun</td><td class="form-jp">${c.noun_modifier}</td></tr>
            <tr><td>Plain Affirmative</td><td class="form-jp">${c.plain_affirmative}</td></tr>
            <tr><td>Plain Negative</td><td class="form-jp">${c.plain_negative}</td></tr>
            <tr><td>Polite Affirmative</td><td class="form-jp">${c.polite_affirmative}</td></tr>
            <tr><td>Polite Negative</td><td class="form-jp">${c.polite_negative}</td></tr>
            <tr><td>Past</td><td class="form-jp">${c.past}</td></tr>
            <tr><td>Te-form</td><td class="form-jp">${c.te_form}</td></tr>
          </tbody>
        </table>
      `;
    }

    this.dom.modalBody.innerHTML = html;
    this.dom.conjModal.classList.add('active');
  }
}

function kanaToRomajiSimple(k) {
  if (!k) return '';
  return k;
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new JLPTApp();
});
