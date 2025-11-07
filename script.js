class JeopardyGame {
  constructor() {
    this.teams = [];
    this.categories = [];
    this.categoriesCount = 5;
    this.questions = {};
    this.answeredQuestions = new Set();
    this.currentQuestion = null;

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

    // Determina si estamos en la carga inicial (cuando this.questions está completamente vacío)
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
      
      // Se mantiene la lógica de conteo dinámico para las preguntas
      let existingCount = Object.keys(this.questions[c]).length;
      
      if (isInitialLoad && existingCount === 0) {
        existingCount = 5;
      }
      
      for (let qIdx = 0; qIdx < existingCount; qIdx++) {
        // MODIFICACIÓN 1: Obtener la data de la pregunta y pasarla
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

  // MODIFICACIÓN 2: Recibir questionData y usarla para rellenar los inputs
  addQuestionItem(container, category, index, questionData = {}) {
    // Usar la data importada, o valores por defecto
    const qText = questionData.question || '';
    const aText = questionData.answer || '';
    const points = questionData.points || (index + 1) * 100;
    const hasQMedia = questionData.qMediaSrc ? ' (Media cargada)' : '';
    const hasAMedia = questionData.aMediaSrc ? ' (Media cargada)' : '';

    const item = document.createElement('div');
    item.className = 'question-item';
    item.innerHTML = `
      <div class="question-header">
        <label>Puntos:</label>
        <input type="number" value="${points}" class="points-input" data-category="${category}" data-question="${index}">
      </div>

      <textarea placeholder="Pregunta..." class="question-input" data-category="${category}" data-question="${index}">${qText}</textarea>

      <label class="file-input-label">
        📎 Agregar imagen/audio/video a la pregunta${hasQMedia}
        <input type="file" accept="image/*,audio/*,video/*" class="file-input question-media" data-category="${category}" data-question="${index}">
      </label>

      <textarea placeholder="Respuesta..." class="answer-input" data-category="${category}" data-question="${index}">${aText}</textarea>

      <label class="file-input-label">
        📎 Agregar imagen/audio/video a la respuesta${hasAMedia}
        <input type="file" accept="image/*,audio/*,video/*" class="file-input answer-media" data-category="${category}" data-question="${index}">
      </label>
    `;

    const addButton = container.querySelector("button.btn-secondary");
    container.insertBefore(item, addButton);

    item.querySelectorAll('.file-input').forEach(input =>
      input.addEventListener('change', (e) => this.handleFileUpload(e))
    );
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

      const type = file.type.startsWith('image/') ? 'image'
            : file.type.startsWith('audio/') ? 'audio'
            : file.type.startsWith('video/') ? 'video'
            : 'unknown';

      if (isQuestionSide) {
        this.questions[category][question].qMediaType = type;
        this.questions[category][question].qMediaSrc = dataURL;
        // Opcional: Actualizar el texto del label para indicar que se cargó el archivo.
        const label = event.target.closest('label');
        if (label) label.innerHTML = `📎 Agregar imagen/audio/video a la pregunta (Media cargada)<input type="file" accept="image/*,audio/*,video/*" class="file-input question-media" data-category="${category}" data-question="${question}">`;
      } else {
        this.questions[category][question].aMediaType = type;
        this.questions[category][question].aMediaSrc = dataURL;
        // Opcional: Actualizar el texto del label para indicar que se cargó el archivo.
        const label = event.target.closest('label');
        if (label) label.innerHTML = `📎 Agregar imagen/audio/video a la respuesta (Media cargada)<input type="file" accept="image/*,audio/*,video/*" class="file-input answer-media" data-category="${category}" data-question="${question}">`;
      }
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
      const questionCount = document.querySelectorAll(`.question-input[data-category="${c}"]`).length;

      for (let q = 0; q < questionCount; q++) {
        const qEl = document.querySelector(`.question-input[data-category="${c}"][data-question="${q}"]`);
        const aEl = document.querySelector(`.answer-input[data-category="${c}"][data-question="${q}"]`);
        const pEl = document.querySelector(`.points-input[data-category="${c}"][data-question="${q}"]`);

        const base = this.questions?.[c]?.[q] || {};
        data.questions[c][q] = {
          question: (qEl?.value || '').trim() || 'Pregunta no definida',
          answer: (aEl?.value || '').trim() || 'Respuesta no definida',
          points: parseInt(pEl?.value || '100', 10),
          qMediaType: base.qMediaType || null,
          qMediaSrc: base.qMediaSrc || null,
          aMediaType: base.aMediaType || null,
          aMediaSrc: base.aMediaSrc || null
        };
      }
    }

    return data;
  }

  applySetupObject(data) {
    // 1. Equipos (MODIFICADO)
    document.getElementById('team-count').value = String(data.teams.length); // Actualiza el select de cantidad
    this.updateTeamInputs(data.teams.length); // Crea los inputs vacíos

    const teamInputs = document.querySelectorAll('.team-name-input');
    data.teams.forEach((t, i) => {
      // Ahora rellenamos los inputs recién creados
      if(teamInputs[i]) teamInputs[i].value = t.name;
    });

    // 2. Categorías y Preguntas
    this.categoriesCount = data.categoriesCount;
    document.getElementById('categories-count').value = String(this.categoriesCount);
    this.updateCategoriesInputs(this.categoriesCount);
    
    // El orden importa: this.questions debe llenarse ANTES de llamar a generateQuestionsSetup()
    this.questions = data.questions || {}; 
    this.generateQuestionsSetup();

    const catInputs = document.querySelectorAll('.category-input');
    data.categories.forEach((cname, i) => {
      if(catInputs[i]) catInputs[i].value = cname;
    });
    this.updateCategoryNames();
  }

  exportJSON() {
    const data = this.buildSetupObject();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jeopardy_setup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        this.applySetupObject(JSON.parse(ev.target.result));
        alert('✅ Juego importado correctamente.');
      } catch {
        alert('❌ Archivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  startGame() {
    this.teams = [];
    document.querySelectorAll('.team-name-input').forEach((input, idx) => {
      const name = input.value.trim();
      if (name) {
          this.teams.push({ name: name, score: 0 });
      }
    });
    
    // FIX: Verificar que hay equipos para jugar
    if (this.teams.length === 0) {
        alert('❌ Debes definir al menos un equipo para empezar el juego.');
        return;
    }

    this.categories = [];
    document.querySelectorAll('.category-input').forEach((input, idx) => {
      this.categories.push(input.value.trim() || `Categoría ${idx + 1}`);
    });

    this.collectQuestions();

    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    this.generateGameInterface();
  }

  collectQuestions() {
    for (let c = 0; c < this.categoriesCount; c++) {
      const questionCount = document.querySelectorAll(`.question-input[data-category="${c}"]`).length;
      for (let q = 0; q < questionCount; q++) {
        const qEl = document.querySelector(`.question-input[data-category="${c}"][data-question="${q}"]`);
        const aEl = document.querySelector(`.answer-input[data-category="${c}"][data-question="${q}"]`);
        const pEl = document.querySelector(`.points-input[data-category="${c}"][data-question="${q}"]`);

        const prev = this.questions[c]?.[q] || {};
        this.questions[c][q] = {
          question: (qEl?.value || '').trim(),
          answer: (aEl?.value || '').trim(),
          points: parseInt(pEl?.value || '100'),
          qMediaType: prev.qMediaType || null,
          qMediaSrc: prev.qMediaSrc || null,
          aMediaType: prev.aMediaType || null,
          aMediaSrc: prev.aMediaSrc || null
        };
      }
    }
  }

  generateGameInterface() {
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = '';
    this.teams.forEach((team, idx) => {
      const div = document.createElement('div');
      div.className = 'team-score';
      div.innerHTML = `
        <div class="team-name">${team.name}</div>
        <div class="score" id="score-${idx}">${team.score}</div>
      `;
      scoreboard.appendChild(div);
    });

    const categoriesHeader = document.getElementById('categories-header');
    const questionsGrid = document.getElementById('questions-grid');
    const board = document.getElementById('game-board');

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

    const maxRows = Math.max(5, ...Object.values(this.questions).map(cat => Object.keys(cat).length));

    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < this.categoriesCount; col++) {
        const cell = document.createElement('div');
        const entry = this.questions[col]?.[row];
        cell.className = 'question-cell';

        if (entry) {
          cell.textContent = `$${entry.points}`;
          cell.dataset.category = col;
          cell.dataset.question = row;
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
    document.getElementById('modal-points').textContent = `${data.points}`;
    document.getElementById('question-text').textContent = data.question;

    this.renderModalMedia('question-media-container', data.qMediaType, data.qMediaSrc);
    document.getElementById('answer-text').textContent = data.answer;
    this.renderModalMedia('answer-media-container', data.aMediaType, data.aMediaSrc);

    document.getElementById('answer-section').classList.add('hidden');
    document.getElementById('show-answer').style.display = 'inline-block';

    this.generateTeamButtons();
    document.getElementById('question-modal').style.display = 'block';
  }

 renderModalMedia(containerId, type, src) {
  const cont = document.getElementById(containerId);
  cont.innerHTML = '';

  if (!type || !src) {
    cont.classList.add('hidden');
    return;
  }

  let el;
  if (type === 'image') {
    el = document.createElement('img');
    el.src = src;
    el.className = 'modal-media';

    // Zoom toggle estable
    el.addEventListener('click', () => {
      el.classList.toggle('zoomed');
      document.body.classList.toggle('zoom-active');
    });

  } else if (type === 'audio') {
    el = document.createElement('audio');
    el.src = src;
    el.controls = true;

  } else if (type === 'video') {
    el = document.createElement('video');
    el.src = src;
    el.controls = true;
    el.className = 'modal-media-video';
  }

  cont.appendChild(el);
  cont.classList.remove('hidden');
}


  generateTeamButtons() {
    const container = document.getElementById('team-buttons');
    container.innerHTML = '';
    this.teams.forEach((team, idx) => {
      const ok = document.createElement('button');
      ok.className = 'team-button correct';
      ok.textContent = `✓ ${team.name}`;
      ok.addEventListener('click', () => this.scoreTeam(idx, true));

      const bad = document.createElement('button');
      bad.className = 'team-button incorrect';
      bad.textContent = `✗ ${team.name}`;
      bad.addEventListener('click', () => this.scoreTeam(idx, false));

      container.appendChild(ok);
      container.appendChild(bad);
    });
  }

  scoreTeam(teamIndex, isCorrect) {
    // 1. Comprobación de seguridad
    if (!this.currentQuestion || !this.currentQuestion.data) {
        return; 
    }
    
    // 2. Garantizar que los puntos son un número válido
    const rawPoints = this.currentQuestion.data.points;
    const points = parseInt(rawPoints, 10);
    
    if (isNaN(points)) {
        return; 
    }

    // 3. Asignar puntaje
    if (isCorrect) this.teams[teamIndex].score += points;
    else this.teams[teamIndex].score -= points;

    // 4. Actualizar el marcador
    document.getElementById(`score-${teamIndex}`).textContent = this.teams[teamIndex].score;

    // 5. FIX CRÍTICO: CERRAR AUTOMÁTICAMENTE LA PREGUNTA
    // Esto previene los clics duplicados, cierra la modal y marca la celda como respondida.
    this.closeModal(); 
  }

  showAnswer() {
    document.getElementById('answer-section').classList.remove('hidden');
    document.getElementById('show-answer').style.display = 'none';
  }

  closeModal() {
    const { categoryIndex, questionIndex } = this.currentQuestion;
    this.answeredQuestions.add(`${categoryIndex}-${questionIndex}`);

    document.querySelector(`.question-cell[data-category="${categoryIndex}"][data-question="${questionIndex}"]`).classList.add('answered');

    document.getElementById('question-modal').style.display = 'none';
    this.currentQuestion = null;

    this.checkGameEnd();
  }

  checkGameEnd() {
    const total = Object.values(this.questions).reduce((sum, cat) => sum + Object.keys(cat).length, 0);
    if (this.answeredQuestions.size >= total) this.showGameEnd();
  }

  showGameEnd() {
    let winner = this.teams.reduce((max, t) => t.score > max.score ? t : max, this.teams[0]);
    alert(`🏆 Ganador: ${winner.name}\nPuntaje: ${winner.score}`);
  }
}

document.addEventListener('DOMContentLoaded', () => new JeopardyGame());