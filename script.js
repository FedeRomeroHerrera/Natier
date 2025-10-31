class JeopardyGame {
  constructor() {
    this.teams = [];
    this.categories = [];
    this.categoriesCount = 5; // columnas
    // Estructura: { [cat]: { [qIdx]: { question, answer, points, qMediaType, qMediaSrc, aMediaType, aMediaSrc } } }
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
    // Equipos
    document.getElementById('team-count').addEventListener('change', (e) => {
      this.updateTeamInputs(parseInt(e.target.value, 10));
    });

    // Cantidad de categorías
    document.getElementById('categories-count').addEventListener('change', (e) => {
      this.categoriesCount = parseInt(e.target.value, 10);
      this.updateCategoriesInputs(this.categoriesCount);
      this.generateQuestionsSetup();
    });

    // Nombres de categorías (tabs + títulos)
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('category-input')) this.updateCategoryNames();
    });

    // Guardar / Cargar / Exportar / Importar
    //document.getElementById('save-local').addEventListener('click', () => this.saveToLocal());
    //document.getElementById('load-local').addEventListener('click', () => this.loadFromLocal());
    document.getElementById('export-json').addEventListener('click', () => this.exportJSON());
    document.getElementById('import-json').addEventListener('change', (e) => this.importJSON(e));

    // Iniciar juego
    document.getElementById('start-game').addEventListener('click', () => this.startGame());

    // Modal
    const modal = document.getElementById('question-modal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => this.closeModal());
    window.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(); });
    document.getElementById('show-answer').addEventListener('click', () => this.showAnswer());
    document.getElementById('close-question').addEventListener('click', () => this.closeModal());
  }

  /* ==== Setup de inputs ==== */

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

  /* ==== Generación UI de preguntas por categoría (setup) ==== */

  generateQuestionsSetup() {
    const container = document.getElementById('questions-container');
    const tabsContainer = document.getElementById('category-tabs');
    container.innerHTML = '';
    tabsContainer.innerHTML = '';

    const points = [100, 200, 300, 400, 500];

    for (let c = 0; c < this.categoriesCount; c++) {
      // Tab
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      tab.textContent = `Categoría ${c + 1}`;
      if (c === 0) tab.classList.add('active');
      tabsContainer.appendChild(tab);

      // Bloque preguntas
      const catDiv = document.createElement('div');
      catDiv.className = 'category-questions';
      if (c === 0) catDiv.classList.add('active');
      catDiv.innerHTML = `<h3>Categoría ${c + 1}</h3>`;

      points.forEach((pt, qIdx) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        item.innerHTML = `
          <div class="question-header">
            <label>Puntos:</label>
            <input type="number" value="${pt}" class="points-input" data-category="${c}" data-question="${qIdx}">
          </div>
          <textarea placeholder="Pregunta..." class="question-input" data-category="${c}" data-question="${qIdx}"></textarea>

          <label class="file-input-label">
            📎 Agregar imagen/audio/video a la pregunta
            <input type="file" accept="image/*,audio/*,video/*" class="file-input question-media" data-category="${c}" data-question="${qIdx}">
          </label>

          <textarea placeholder="Respuesta..." class="answer-input" data-category="${c}" data-question="${qIdx}"></textarea>

          <label class="file-input-label">
            📎 Agregar imagen/audio/video a la respuesta
            <input type="file" accept="image/*,audio/*,video/*" class="file-input answer-media" data-category="${c}" data-question="${qIdx}">
          </label>
        `;
        catDiv.appendChild(item);
      });

      container.appendChild(catDiv);

      // Tab click
      tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.category-questions').forEach(q => q.classList.remove('active'));
        tab.classList.add('active');
        catDiv.classList.add('active');
      });
    }

    // Listeners archivo
    document.querySelectorAll('.file-input').forEach(input => {
      input.addEventListener('change', (e) => this.handleFileUpload(e));
    });

    // Nombres si ya están cargados
    this.updateCategoryNames();
  }

  handleFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target.result;
      const category = String(event.target.dataset.category);
      const question = String(event.target.dataset.question);
      const isQuestionSide = event.target.classList.contains('question-media');

      if (!this.questions[category]) this.questions[category] = {};
      if (!this.questions[category][question]) this.questions[category][question] = {};

      // Tipo de media
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('audio/')
        ? 'audio'
        : file.type.startsWith('video/')
        ? 'video'
        : 'unknown';

      // Guardar
      if (isQuestionSide) {
        this.questions[category][question].qMediaType = type;
        this.questions[category][question].qMediaSrc = dataURL;
      } else {
        this.questions[category][question].aMediaType = type;
        this.questions[category][question].aMediaSrc = dataURL;
      }

      // Preview en setup
      // Borramos preview anterior si existía
      const parent = event.target.parentNode;
      parent.querySelectorAll('.file-preview, .file-preview-audio, .file-preview-video').forEach(el => el.remove());

      if (type === 'image') {
        const img = document.createElement('img');
        img.className = 'file-preview';
        img.src = dataURL;
        img.alt = file.name;
        parent.appendChild(img);
      } else if (type === 'audio') {
        const audio = document.createElement('audio');
        audio.className = 'file-preview-audio';
        audio.src = dataURL;
        audio.controls = true;
        parent.appendChild(audio);
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.className = 'file-preview-video';
        video.src = dataURL;
        video.controls = true;
        video.muted = true;
        parent.appendChild(video);
      }
    };
    reader.readAsDataURL(file);
  }

  /* ==== Guardado / Carga ==== */

  buildSetupObject() {
    // Equipos
    const teams = [];
    document.querySelectorAll('.team-name-input').forEach((input, idx) => {
      teams.push({ name: input.value.trim() || `Equipo ${idx + 1}`, score: 0 });
    });

    // Categorías
    const categories = [];
    document.querySelectorAll('.category-input').forEach((input, idx) => {
      categories.push(input.value.trim() || `Categoría ${idx + 1}`);
    });

    // Preguntas
    const data = { categoriesCount: this.categoriesCount, teams, categories, questions: {} };
    for (let c = 0; c < this.categoriesCount; c++) {
      data.questions[c] = {};
      for (let q = 0; q < 5; q++) {
        const qEl = document.querySelector(`.question-input[data-category="${c}"][data-question="${q}"]`);
        const aEl = document.querySelector(`.answer-input[data-category="${c}"][data-question="${q}"]`);
        const pEl = document.querySelector(`.points-input[data-category="${c}"][data-question="${q}"]`);

        const base = this.questions?.[c]?.[q] || {};
        data.questions[c][q] = {
          question: (qEl?.value || '').trim() || 'Pregunta no definida',
          answer: (aEl?.value || '').trim() || 'Respuesta no definida',
          points: parseInt(pEl?.value || '100', 10) || 100,
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
    // Cantidad categorías
    this.categoriesCount = parseInt(data.categoriesCount || '5', 10);
    document.getElementById('categories-count').value = String(this.categoriesCount);
    this.updateCategoriesInputs(this.categoriesCount);
    this.generateQuestionsSetup();

    // Equipos
    const teamCount = Math.max(2, data.teams?.length || 2);
    document.getElementById('team-count').value = String(teamCount);
    this.updateTeamInputs(teamCount);
    const teamInputs = document.querySelectorAll('.team-name-input');
    data.teams?.forEach((t, i) => { if (teamInputs[i]) teamInputs[i].value = t.name; });

    // Categorías
    const catInputs = document.querySelectorAll('.category-input');
    data.categories?.forEach((cname, i) => { if (catInputs[i]) catInputs[i].value = cname; });
    this.updateCategoryNames();

    // Preguntas + medios
    this.questions = data.questions || {};
    for (let c = 0; c < this.categoriesCount; c++) {
      for (let q = 0; q < 5; q++) {
        const entry = data.questions?.[c]?.[q];
        if (!entry) continue;
        const qEl = document.querySelector(`.question-input[data-category="${c}"][data-question="${q}"]`);
        const aEl = document.querySelector(`.answer-input[data-category="${c}"][data-question="${q}"]`);
        const pEl = document.querySelector(`.points-input[data-category="${c}"][data-question="${q}"]`);
        if (qEl) qEl.value = entry.question || '';
        if (aEl) aEl.value = entry.answer || '';
        if (pEl) pEl.value = String(entry.points || 100);

        // preview de medios
        if (entry.qMediaType && entry.qMediaSrc) {
          const parent = qEl?.nextElementSibling; // label file pregunta
          if (parent) this.drawSetupPreview(parent, entry.qMediaType, entry.qMediaSrc);
        }
        if (entry.aMediaType && entry.aMediaSrc) {
          const aLabel = aEl?.nextElementSibling; // label file respuesta
          if (aLabel) this.drawSetupPreview(aLabel, entry.aMediaType, entry.aMediaSrc);
        }
      }
    }
  }

  drawSetupPreview(parent, type, src) {
    parent.querySelectorAll('.file-preview, .file-preview-audio, .file-preview-video').forEach(el => el.remove());
    if (type === 'image') {
      const img = document.createElement('img');
      img.className = 'file-preview';
      img.src = src;
      parent.appendChild(img);
    } else if (type === 'audio') {
      const audio = document.createElement('audio');
      audio.className = 'file-preview-audio';
      audio.src = src;
      audio.controls = true;
      parent.appendChild(audio);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.className = 'file-preview-video';
      video.src = src;
      video.controls = true;
      video.muted = true;
      parent.appendChild(video);
    }
  }

  saveToLocal() {
    const data = this.buildSetupObject();
    localStorage.setItem('jeopardy_setup', JSON.stringify(data));
    alert('✅ Juego guardado en este dispositivo.');
  }

  loadFromLocal() {
    const raw = localStorage.getItem('jeopardy_setup');
    if (!raw) { alert('No se encontró un guardado local.'); return; }
    try {
      const data = JSON.parse(raw);
      this.applySetupObject(data);
      alert('✅ Juego cargado desde este dispositivo.');
    } catch {
      alert('❌ Error al leer el guardado local.');
    }
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
        const data = JSON.parse(ev.target.result);
        this.applySetupObject(data);
        alert('✅ Juego importado desde JSON.');
      } catch {
        alert('❌ Archivo JSON inválido.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  /* ==== Inicio del juego ==== */

  startGame() {
    // Equipos
    this.teams = [];
    document.querySelectorAll('.team-name-input').forEach((input, idx) => {
      const name = input.value.trim() || `Equipo ${idx + 1}`;
      this.teams.push({ name, score: 0 });
    });

    // Categorías
    this.categories = [];
    document.querySelectorAll('.category-input').forEach((input, idx) => {
      const name = input.value.trim() || `Categoría ${idx + 1}`;
      this.categories.push(name);
    });

    // Preguntas
    this.collectQuestions();

    // Pantallas
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    // UI
    this.generateGameInterface();
  }

  collectQuestions() {
    for (let c = 0; c < this.categoriesCount; c++) {
      if (!this.questions[c]) this.questions[c] = {};
      for (let q = 0; q < 5; q++) {
        const qEl = document.querySelector(`.question-input[data-category="${c}"][data-question="${q}"]`);
        const aEl = document.querySelector(`.answer-input[data-category="${c}"][data-question="${q}"]`);
        const pEl = document.querySelector(`.points-input[data-category="${c}"][data-question="${q}"]`);

        const question = (qEl?.value || '').trim() || 'Pregunta no definida';
        const answer = (aEl?.value || '').trim() || 'Respuesta no definida';
        const points = parseInt(pEl?.value || '100', 10) || 100;

        const prev = this.questions[c][q] || {};
        this.questions[c][q] = {
          question, answer, points,
          qMediaType: prev.qMediaType || null,
          qMediaSrc: prev.qMediaSrc || null,
          aMediaType: prev.aMediaType || null,
          aMediaSrc: prev.aMediaSrc || null
        };
      }
    }
  }

  /* ==== UI del tablero ==== */

  generateGameInterface() {
    // Scoreboard
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

    // Cabecera de categorías
    const categoriesHeader = document.getElementById('categories-header');
    const questionsGrid = document.getElementById('questions-grid');
    const board = document.getElementById('game-board');

    categoriesHeader.innerHTML = '';
    questionsGrid.innerHTML = '';

    // Grid dinámico: columnas = categoriesCount
    categoriesHeader.style.gridTemplateColumns = `repeat(${this.categoriesCount}, 1fr)`;
    questionsGrid.style.gridTemplateColumns = `repeat(${this.categoriesCount}, 1fr)`;

    // Clase para escalado
    board.className = 'game-board';
    if (this.categoriesCount >= 6) {
      const capped = Math.min(this.categoriesCount, 10);
      board.classList.add(`cols-${capped}`);
    }

    this.categories.slice(0, this.categoriesCount).forEach(cat => {
      const el = document.createElement('div');
      el.className = 'category-header';
      el.textContent = cat;
      categoriesHeader.appendChild(el);
    });

    // Celdas preguntas
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < this.categoriesCount; col++) {
        const cell = document.createElement('div');
        cell.className = 'question-cell';
        const pts = this.questions[col]?.[row]?.points ?? (row + 1) * 100;
        cell.textContent = `$${pts}`;
        cell.dataset.category = String(col);
        cell.dataset.question = String(row);

        // Ahora se puede reabrir aunque esté respondida
        cell.addEventListener('click', () => {
          this.showQuestion(col, row);
        });

        questionsGrid.appendChild(cell);
      }
    }
  }

  showQuestion(categoryIndex, questionIndex) {
    const data = this.questions[categoryIndex]?.[questionIndex];
    if (!data) return;

    this.currentQuestion = { categoryIndex, questionIndex, data };

    // Llenar modal
    document.getElementById('modal-category').textContent = this.categories[categoryIndex] ?? `Categoría ${categoryIndex + 1}`;
    document.getElementById('modal-points').textContent = `${data.points}`;
    document.getElementById('question-text').textContent = data.question;

    // Media pregunta
    this.renderModalMedia('question-media-container', data.qMediaType, data.qMediaSrc);

    // Respuesta
    document.getElementById('answer-text').textContent = data.answer;
    // Media respuesta
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
  el.className = 'modal-media zoomable';
  el.src = src;
  el.addEventListener('click', () => {
    el.classList.toggle('zoomed');
  });
} else if (type === 'audio') {
  el = document.createElement('audio');
  el.className = 'modal-media';
  el.src = src;
  el.controls = true;
} else if (type === 'video') {
  el = document.createElement('video');
  el.className = 'modal-media video';
  el.src = src;
  el.controls = true;
}

    if (el) {
      cont.appendChild(el);
      cont.classList.remove('hidden');
    } else {
      cont.classList.add('hidden');
    }
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
    if (!this.currentQuestion) return;
    const points = this.currentQuestion.data.points;

    if (isCorrect) this.teams[teamIndex].score += points;
    else this.teams[teamIndex].score -= points;

    document.getElementById(`score-${teamIndex}`).textContent = this.teams[teamIndex].score;
    this.showScoreAnimation(teamIndex, isCorrect, points);
  }

  showScoreAnimation(teamIndex, isCorrect, points) {
    const el = document.getElementById(`score-${teamIndex}`);
    const temp = isCorrect ? `+${points}` : `-${points}`;
    el.style.color = isCorrect ? '#4CAF50' : '#f44336';
    el.textContent = temp;
    setTimeout(() => {
      el.style.color = '#ffd700';
      el.textContent = this.teams[teamIndex].score;
    }, 900);
  }

  showAnswer() {
    document.getElementById('answer-section').classList.remove('hidden');
    document.getElementById('show-answer').style.display = 'none';
  }

  closeModal() {
    if (this.currentQuestion) {
      const { categoryIndex, questionIndex } = this.currentQuestion;
      const key = `${categoryIndex}-${questionIndex}`;
      this.answeredQuestions.add(key);

      const cell = document.querySelector(`.question-cell[data-category="${categoryIndex}"][data-question="${questionIndex}"]`);
      if (cell) {
        cell.classList.add('answered');
        cell.textContent = 'X'; // queda marcada pero se puede reabrir
      }
    }
    document.getElementById('question-modal').style.display = 'none';
    document.getElementById('answer-section').classList.add('hidden');
    document.getElementById('show-answer').style.display = 'inline-block';
    this.currentQuestion = null;

    this.checkGameEnd();
  }

  checkGameEnd() {
    const total = this.categoriesCount * 5;
    if (this.answeredQuestions.size >= total) {
      setTimeout(() => this.showGameEnd(), 600);
    }
  }

  showGameEnd() {
    let winner = this.teams[0];
    this.teams.forEach(t => { if (t.score > winner.score) winner = t; });

    const msg = `🎉 ¡Juego terminado! 🎉\n\n🏆 Ganador: ${winner.name}\nPuntaje: ${winner.score}\n\nPuntajes finales:\n${this.teams.map(t => `${t.name}: ${t.score}`).join('\n')}`;
    alert(msg);

    if (confirm('¿Querés configurar un nuevo juego?')) this.resetGame();
  }

  resetGame() {
    this.teams = [];
    this.categories = [];
    this.questions = {};
    this.answeredQuestions.clear();
    this.currentQuestion = null;

    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('setup-screen').classList.add('active');

    document.getElementById('team-count').value = '2';
    this.updateTeamInputs(2);

    const countSel = document.getElementById('categories-count');
    this.categoriesCount = parseInt(countSel.value || '5', 10);
    this.updateCategoriesInputs(this.categoriesCount);
    this.generateQuestionsSetup();
  }
}

/* ==== Boot ==== */
document.addEventListener('DOMContentLoaded', () => {
  new JeopardyGame();
});

/* Confirmación al salir durante el juego */
window.addEventListener('beforeunload', (e) => {
  const setupActive = document.getElementById('setup-screen')?.classList.contains('active');
  const gameActive = document.getElementById('game-screen')?.classList.contains('active');
  if (gameActive && !setupActive) {
    e.preventDefault();
    e.returnValue = '¿Estás seguro de que querés salir? Se perderá el progreso del juego.';
    return e.returnValue;
  }
});
