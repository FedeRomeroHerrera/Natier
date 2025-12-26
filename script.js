class JeopardyGame {
  constructor() {
    this.teams = [];
    this.categories = [];
    this.categoriesCount = 5;
    this.questions = {};
    this.answeredQuestions = new Set();
    this.currentQuestion = null;
    this.timerInterval = null;
    this.timeLeft = 0;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateTeamInputs(2);
    this.updateCategoriesInputs(this.categoriesCount);
    this.generateQuestionsSetup();
  }

  setupEventListeners() {
    document.getElementById('team-count').addEventListener('change', (e) => {
      this.updateTeamInputs(parseInt(e.target.value, 10));
    });

    document.getElementById('categories-count').addEventListener('change', (e) => {
      this.categoriesCount = parseInt(e.target.value, 10);
      this.updateCategoriesInputs(this.categoriesCount);
      this.generateQuestionsSetup();
    });

    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('category-input')) this.updateCategoryNames();
    });

    document.getElementById('export-json').addEventListener('click', () => this.exportJSON());
    document.getElementById('import-json').addEventListener('change', (e) => this.importJSON(e));
    document.getElementById('start-game').addEventListener('click', () => this.startGame());

    const modal = document.getElementById('question-modal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => this.closeModal());
    window.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(); });
    document.getElementById('show-answer').addEventListener('click', () => this.showAnswer());
    document.getElementById('close-question').addEventListener('click', () => this.closeModal());
  }

  updateTeamInputs(teamCount) {
    const container = document.getElementById('team-names');
    container.innerHTML = '';
    for (let i = 0; i < teamCount; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Nombre del Equipo ${i + 1}`;
      input.className = 'team-name-input';
      container.appendChild(input);
    }
  }

  updateCategoriesInputs(categoriesCount) {
    const container = document.getElementById('categories-inputs');
    container.innerHTML = '';
    for (let i = 0; i < categoriesCount; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Categoría ${i + 1}`;
      input.className = 'category-input';
      input.dataset.index = String(i);
      container.appendChild(input);
    }
  }

  updateCategoryNames() {
    const categoryInputs = document.querySelectorAll('.category-input');
    const tabs = document.querySelectorAll('.category-tab');
    const titles = document.querySelectorAll('.category-questions h3');
    categoryInputs.forEach((input, idx) => {
      const name = input.value.trim() || `Categoría ${idx + 1}`;
      if (tabs[idx]) tabs[idx].textContent = name;
      if (titles[idx]) titles[idx].textContent = name;
    });
  }

  generateQuestionsSetup() {
    const container = document.getElementById('questions-container');
    const tabsContainer = document.getElementById('category-tabs');
    container.innerHTML = '';
    tabsContainer.innerHTML = '';

    const isInitialLoad = Object.keys(this.questions).length === 0;

    for (let c = 0; c < this.categoriesCount; c++) {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      tab.textContent = `Categoría ${c + 1}`;
      if (c === 0) tab.classList.add('active');
      tabsContainer.appendChild(tab);

      const catDiv = document.createElement('div');
      catDiv.className = 'category-questions';
      if (c === 0) catDiv.classList.add('active');
      catDiv.innerHTML = `<h3>Categoría ${c + 1}</h3>`;

      if (!this.questions[c]) this.questions[c] = {};
      let existingCount = Object.keys(this.questions[c]).length;
      if (isInitialLoad && existingCount === 0) existingCount = 5;
      
      for (let qIdx = 0; qIdx < existingCount; qIdx++) {
        const questionData = this.questions[c][qIdx] || {};
        this.addQuestionItem(catDiv, c, qIdx, questionData);
      }

      const addBtn = document.createElement('button');
      addBtn.textContent = "+ Agregar Pregunta";
      addBtn.className = "btn-secondary";
      addBtn.style.marginTop = "10px";
      addBtn.addEventListener('click', () => {
        const newIndex = catDiv.querySelectorAll('.question-item').length;
        this.addQuestionItem(catDiv, c, newIndex);
      });
      catDiv.appendChild(addBtn);
      container.appendChild(catDiv);

      tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.category-questions').forEach(q => q.classList.remove('active'));
        tab.classList.add('active');
        catDiv.classList.add('active');
      });
    }
  }

  addQuestionItem(container, category, index, questionData = {}) {
    const qText = questionData.question || '';
    const aText = questionData.answer || '';
    const points = questionData.points || (index + 1) * 100;
    const hasQMedia = questionData.qMediaSrc ? ' (Media cargada)' : '';
    const hasAMedia = questionData.aMediaSrc ? ' (Media cargada)' : '';

    const item = document.createElement('div');
    item.className = 'question-item';
    item.innerHTML = `
      <button class="delete-question" title="Eliminar pregunta">×</button>
      <div class="question-header">
        <label>Puntos:</label>
        <input type="number" value="${points}" class="points-input" data-category="${category}" data-question="${index}">
      </div>
      <textarea placeholder="Pregunta..." class="question-input" data-category="${category}" data-question="${index}">${qText}</textarea>
      <label class="file-input-label">
        📎 Agregar multimedia a pregunta${hasQMedia}
        <input type="file" accept="image/*,audio/*,video/*" class="file-input question-media" data-category="${category}" data-question="${index}">
      </label>
      <textarea placeholder="Respuesta..." class="answer-input" data-category="${category}" data-question="${index}">${aText}</textarea>
      <label class="file-input-label">
        📎 Agregar multimedia a respuesta${hasAMedia}
        <input type="file" accept="image/*,audio/*,video/*" class="file-input answer-media" data-category="${category}" data-question="${index}">
      </label>
    `;

    const addButton = container.querySelector("button.btn-secondary");
    container.insertBefore(item, addButton);

    item.querySelector('.delete-question').addEventListener('click', () => {
      if(confirm('¿Eliminar esta pregunta?')) {
        item.remove();
        this.reindexQuestions(container, category);
      }
    });

    item.querySelectorAll('.file-input').forEach(input =>
      input.addEventListener('change', (e) => this.handleFileUpload(e))
    );
  }

  reindexQuestions(container, categoryIndex) {
    const items = container.querySelectorAll('.question-item');
    items.forEach((item, newIdx) => {
      // 1. Actualizar el valor de los puntos automáticamente (100, 200, 300...)
      const pointsInput = item.querySelector('.points-input');
      const newPoints = (newIdx + 1) * 100;
      if (pointsInput) {
        pointsInput.value = newPoints;
      }

      // 2. Actualizar todos los data-attributes para que el motor del juego sepa el nuevo orden
      item.querySelectorAll('input, textarea').forEach(el => {
        if (el.dataset.question) el.dataset.question = String(newIdx);
      });
      item.querySelectorAll('.file-input').forEach(el => {
        el.dataset.question = String(newIdx);
      });
    });
  }

  handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target.result;
      const category = event.target.dataset.category;
      const question = event.target.dataset.question;
      const isQuestionSide = event.target.classList.contains('question-media');
      if (!this.questions[category]) this.questions[category] = {};
      if (!this.questions[category][question]) this.questions[category][question] = {};

      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'unknown';

      if (isQuestionSide) {
        this.questions[category][question].qMediaType = type;
        this.questions[category][question].qMediaSrc = dataURL;
      } else {
        this.questions[category][question].aMediaType = type;
        this.questions[category][question].aMediaSrc = dataURL;
      }
      const label = event.target.closest('label');
      if (label) label.childNodes[0].textContent = `📎 Media cargada `;
    };
    reader.readAsDataURL(file);
  }

  buildSetupObject() {
    const teams = [];
    document.querySelectorAll('.team-name-input').forEach((input, idx) => {
      teams.push({ name: input.value.trim() || `Equipo ${idx + 1}`, score: 0 });
    });
    const categories = [];
    document.querySelectorAll('.category-input').forEach((input, idx) => {
      categories.push(input.value.trim() || `Categoría ${idx + 1}`);
    });
    const data = { categoriesCount: this.categoriesCount, teams, categories, questions: {} };
    for (let c = 0; c < this.categoriesCount; c++) {
      data.questions[c] = {};
      const catDiv = document.querySelectorAll('.category-questions')[c];
      const qItems = catDiv.querySelectorAll('.question-item');
      qItems.forEach((item, qIdx) => {
        const qText = item.querySelector('.question-input').value.trim();
        const aText = item.querySelector('.answer-input').value.trim();
        const pts = parseInt(item.querySelector('.points-input').value, 10);
        const base = this.questions?.[c]?.[qIdx] || {};
        data.questions[c][qIdx] = {
          question: qText || 'Pregunta no definida',
          answer: aText || 'Respuesta no definida',
          points: pts,
          qMediaType: base.qMediaType || null,
          qMediaSrc: base.qMediaSrc || null,
          aMediaType: base.aMediaType || null,
          aMediaSrc: base.aMediaSrc || null
        };
      });
    }
    return data;
  }

  applySetupObject(data) {
    document.getElementById('team-count').value = String(data.teams.length);
    this.updateTeamInputs(data.teams.length);
    const teamInputs = document.querySelectorAll('.team-name-input');
    data.teams.forEach((t, i) => { if(teamInputs[i]) teamInputs[i].value = t.name; });
    this.categoriesCount = data.categoriesCount;
    document.getElementById('categories-count').value = String(this.categoriesCount);
    this.updateCategoriesInputs(this.categoriesCount);
    this.questions = data.questions || {}; 
    this.generateQuestionsSetup();
    const catInputs = document.querySelectorAll('.category-input');
    data.categories.forEach((cname, i) => { if(catInputs[i]) catInputs[i].value = cname; });
    this.updateCategoryNames();
  }

  exportJSON() {
    const data = this.buildSetupObject();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jeopardy_setup.json';
    a.click();
  }

  importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { this.applySetupObject(JSON.parse(ev.target.result)); } 
      catch { alert('❌ Archivo inválido.'); }
    };
    reader.readAsText(file);
  }

  startGame() {
    const setupData = this.buildSetupObject();
    this.teams = setupData.teams;
    this.categories = setupData.categories;
    this.questions = setupData.questions;

    if (this.teams.length === 0) {
      alert('❌ Agregá equipos.');
      return;
    }

    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    this.generateGameInterface();
  }

  generateGameInterface() {
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = '';
    this.teams.forEach((team, idx) => {
      const div = document.createElement('div');
      div.className = 'team-score';
      div.innerHTML = `<div class="team-name">${team.name}</div><div class="score" id="score-${idx}">${team.score}</div>`;
      scoreboard.appendChild(div);
    });

    const categoriesHeader = document.getElementById('categories-header');
    const questionsGrid = document.getElementById('questions-grid');
    categoriesHeader.innerHTML = '';
    questionsGrid.innerHTML = '';

    categoriesHeader.style.gridTemplateColumns = `repeat(${this.categoriesCount}, 1fr)`;
    questionsGrid.style.gridTemplateColumns = `repeat(${this.categoriesCount}, 1fr)`;

    this.categories.forEach(cat => {
      const el = document.createElement('div');
      el.className = 'category-header';
      el.textContent = cat;
      categoriesHeader.appendChild(el);
    });

    const maxQuestions = Math.max(...Object.values(this.questions).map(c => Object.keys(c).length));

    for (let row = 0; row < maxQuestions; row++) {
      for (let col = 0; col < this.categoriesCount; col++) {
        const cell = document.createElement('div');
        cell.className = 'question-cell';
        const entry = this.questions[col]?.[row];
        if (entry) {
          cell.textContent = `$${entry.points}`;
          cell.addEventListener('click', () => this.showQuestion(col, row));
        } else {
          cell.style.visibility = "hidden";
        }
        questionsGrid.appendChild(cell);
      }
    }
  }

  showQuestion(categoryIndex, questionIndex) {
    const data = this.questions[categoryIndex][questionIndex];
    this.currentQuestion = { categoryIndex, questionIndex, data };
    document.getElementById('modal-category').textContent = this.categories[categoryIndex];
    document.getElementById('modal-points').textContent = `$${data.points}`;
    document.getElementById('question-text').textContent = data.question;
    this.renderModalMedia('question-media-container', data.qMediaType, data.qMediaSrc);
    document.getElementById('answer-text').textContent = data.answer;
    this.renderModalMedia('answer-media-container', data.aMediaType, data.aMediaSrc);
    document.getElementById('answer-section').classList.add('hidden');
    document.getElementById('show-answer').style.display = 'inline-block';
    this.generateTeamButtons();
    document.getElementById('question-modal').style.display = 'block';
    this.startTimer();
  }

  renderModalMedia(containerId, type, src) {
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    if (!type || !src) { cont.classList.add('hidden'); return; }
    let el;
    if (type === 'image') {
      el = document.createElement('img');
      el.src = src; el.className = 'modal-media';
      el.onclick = () => { el.classList.toggle('zoomed'); document.body.classList.toggle('zoom-active'); };
    } else if (type === 'audio') {
      el = document.createElement('audio'); el.src = src; el.controls = true;
    } else if (type === 'video') {
      el = document.createElement('video'); el.src = src; el.controls = true; el.className = 'modal-media-video';
    }
    cont.appendChild(el);
    cont.classList.remove('hidden');
  }

  generateTeamButtons() {
    const container = document.getElementById('team-buttons');
    container.innerHTML = '';
    this.teams.forEach((team, idx) => {
      const ok = document.createElement('button');
      ok.className = 'team-button correct'; ok.textContent = `✓ ${team.name}`;
      ok.onclick = () => this.scoreTeam(idx, true);
      const bad = document.createElement('button');
      bad.className = 'team-button incorrect'; bad.textContent = `✗ ${team.name}`;
      bad.onclick = () => this.scoreTeam(idx, false);
      container.appendChild(ok); container.appendChild(bad);
    });
  }

  scoreTeam(teamIndex, isCorrect) {
    const pts = this.currentQuestion.data.points;
    this.teams[teamIndex].score += isCorrect ? pts : -pts;
    document.getElementById(`score-${teamIndex}`).textContent = this.teams[teamIndex].score;
    this.closeModal();
  }

  showAnswer() {
    this.clearTimer();
    document.getElementById('answer-section').classList.remove('hidden');
    document.getElementById('show-answer').style.display = 'none';
  }

  closeModal() {
    this.clearTimer();
    if (this.currentQuestion) {
      const { categoryIndex, questionIndex } = this.currentQuestion;
      this.answeredQuestions.add(`${categoryIndex}-${questionIndex}`);
      // Marcar como respondida visualmente usando el orden en el grid
      const cells = document.querySelectorAll('.question-cell');
      const targetIdx = (questionIndex * this.categoriesCount) + categoryIndex;
      if (cells[targetIdx]) cells[targetIdx].classList.add('answered');
    }
    document.getElementById('question-modal').style.display = 'none';
    this.currentQuestion = null;
  }

  startTimer() {
    this.clearTimer();
    this.timeLeft = 30;
    const header = document.querySelector('.modal-header');
    let td = document.getElementById('question-timer');
    if (!td) {
      td = document.createElement('div');
      td.id = 'question-timer';
      header.appendChild(td);
    }
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      td.textContent = `⏱️ ${this.timeLeft}`;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        document.body.classList.add('flash');
        setTimeout(() => document.body.classList.remove('flash'), 400);
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const td = document.getElementById('question-timer');
    if (td) td.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => new JeopardyGame());