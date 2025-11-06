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
      const existingCount = Object.keys(this.questions[c]).length || 5;

      for (let qIdx = 0; qIdx < existingCount; qIdx++) {
        this.addQuestionItem(catDiv, c, qIdx);
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

  addQuestionItem(container, category, index) {
    const item = document.createElement('div');
    item.className = 'question-item';
    
    const existingData = this.questions[category]?.[index];
    const points = existingData?.points || (index + 1) * 100;
    const question = existingData?.question || '';
    const answer = existingData?.answer || '';
    
    item.innerHTML = `
      <div class="question-header">
        <label>Puntos:</label>
        <input type="number" value="${points}" class="points-input" data-category="${category}" data-question="${index}">
      </div>

      <textarea placeholder="Pregunta..." class="question-input" data-category="${category}" data-question="${index}">${question}</textarea>

      <label class="file-input-label">
        📎 Agregar imagen/audio/video a la pregunta
        <input type="file" accept="image/*,audio/*,video/*" class="file-input question-media" data-category="${category}" data-question="${index}">
      </label>

      <textarea placeholder="Respuesta..." class="answer-input" data-category="${category}" data-question="${index}">${answer}</textarea>

      <label class="file-input-label">
        📎 Agregar imagen/audio/video a la respuesta
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
      } else {
        this.questions[category][question].aMediaType = type;
        this.questions[category][question].aMediaSrc = dataURL;
      }
    };
    reader.readAsDataURL(file);
  }

  buildSetupObject() {
    const data = {};

    // Equipos
    const teamInputs = document.querySelectorAll('.team-name-input');
    data.teams = Array.from(teamInputs).map((input, idx) => ({
      name: input.value.trim() || `Equipo ${idx + 1}`,
      score: 0
    }));

    // Categorías
    const categoryInputs = document.querySelectorAll('.category-input');
    const categories = Array.from(categoryInputs).map((input, idx) => 
      input.value.trim() || `Categoría ${idx + 1}`
    );

    // Preguntas por categoría
    data.categories = categories.map((catName, cIndex) => {
      const questionsForCategory = [];
      
      // Buscar todos los question-item de esta categoría
      const categoryQuestions = document.querySelectorAll('.category-questions')[cIndex];
      if (categoryQuestions) {
        const items = categoryQuestions.querySelectorAll('.question-item');
        
        items.forEach((item) => {
          const qText = item.querySelector('.question-input')?.value.trim() || '';
          const aText = item.querySelector('.answer-input')?.value.trim() || '';
          const points = parseInt(item.querySelector('.points-input')?.value) || 100;
          
          const qMediaInput = item.querySelector('.question-media');
          const aMediaInput = item.querySelector('.answer-media');
          
          let qMedia = null;
          let aMedia = null;
          
          // Revisar si hay media guardada en this.questions
          const catIndex = parseInt(qMediaInput?.dataset.category);
          const qIndex = parseInt(qMediaInput?.dataset.question);
          
          if (!isNaN(catIndex) && !isNaN(qIndex) && this.questions[catIndex]?.[qIndex]) {
            const stored = this.questions[catIndex][qIndex];
            if (stored.qMediaSrc) {
              qMedia = { type: stored.qMediaType, src: stored.qMediaSrc };
            }
            if (stored.aMediaSrc) {
              aMedia = { type: stored.aMediaType, src: stored.aMediaSrc };
            }
          }
          
          questionsForCategory.push({
            question: qText,
            answer: aText,
            points: points,
            qMedia: qMedia,
            aMedia: aMedia
          });
        });
      }
      
      return {
        title: catName,
        questions: questionsForCategory
      };
    });

    return data;
  }

  applySetupObject(data) {
    if (!data || !data.categories) {
      alert("Archivo inválido");
      return;
    }

    // Cargar equipos
    const teamCount = data.teams?.length || 2;
    document.getElementById('team-count').value = teamCount;
    this.updateTeamInputs(teamCount);
    
    setTimeout(() => {
      const teamInputs = document.querySelectorAll('.team-name-input');
      data.teams?.forEach((team, idx) => {
        if (teamInputs[idx]) {
          teamInputs[idx].value = team.name;
        }
      });
    }, 50);

    // Cargar categorías
    const catCount = data.categories.length;
    document.getElementById('categories-count').value = catCount;
    this.categoriesCount = catCount;
    this.updateCategoriesInputs(catCount);
    
    // Convertir formato de preguntas
    this.questions = {};
    data.categories.forEach((cat, cIndex) => {
      this.questions[cIndex] = {};
      cat.questions?.forEach((q, qIndex) => {
        this.questions[cIndex][qIndex] = {
          question: q.question || '',
          answer: q.answer || '',
          points: q.points || 100,
          qMediaType: q.qMedia?.type || null,
          qMediaSrc: q.qMedia?.src || null,
          aMediaType: q.aMedia?.type || null,
          aMediaSrc: q.aMedia?.src || null
        };
      });
    });
    
    setTimeout(() => {
      const categoryInputs = document.querySelectorAll('.category-input');
      data.categories.forEach((cat, idx) => {
        if (categoryInputs[idx]) {
          categoryInputs[idx].value = cat.title;
        }
      });
      
      this.generateQuestionsSetup();
      
      // Llenar los campos de preguntas
      setTimeout(() => {
        data.categories.forEach((cat, cIndex) => {
          const categoryContainer = document.querySelectorAll('.category-questions')[cIndex];
          if (categoryContainer) {
            const items = categoryContainer.querySelectorAll('.question-item');
            
            cat.questions?.forEach((q, qIndex) => {
              if (items[qIndex]) {
                const item = items[qIndex];
                const qInput = item.querySelector('.question-input');
                const aInput = item.querySelector('.answer-input');
                const pInput = item.querySelector('.points-input');
                
                if (qInput) qInput.value = q.question || '';
                if (aInput) aInput.value = q.answer || '';
                if (pInput) pInput.value = q.points || 100;
              }
            });
          }
        });
      }, 100);
    }, 100);
  }

  exportJSON() {
    const data = this.buildSetupObject();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
      } catch (err) {
        console.error(err);
        alert('❌ Archivo inválido.');
      }
    };
    reader.readAsText(file);
  }

  startGame() {
    this.teams = [];
    document.querySelectorAll('.team-name-input').forEach((input, idx) => {
      this.teams.push({ name: input.value.trim() || `Equipo ${idx + 1}`, score: 0 });
    });

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
    this.questions = {};

    const categoryContainers = document.querySelectorAll('.category-questions');

    categoryContainers.forEach((catContainer, cIndex) => {
      const questionItems = catContainer.querySelectorAll('.question-item');
      this.questions[cIndex] = {};

      questionItems.forEach((item, qIndex) => {
        const qText = item.querySelector('.question-input').value.trim();
        const aText = item.querySelector('.answer-input').value.trim();
        const points = parseInt(item.querySelector('.points-input').value) || 100;

        const category = item.querySelector('.question-input').dataset.category;
        const question = item.querySelector('.question-input').dataset.question;

        // Obtener media guardada
        let qMediaType = null, qMediaSrc = null;
        let aMediaType = null, aMediaSrc = null;

        if (this.questions[category]?.[question]) {
          const stored = this.questions[category][question];
          qMediaType = stored.qMediaType;
          qMediaSrc = stored.qMediaSrc;
          aMediaType = stored.aMediaType;
          aMediaSrc = stored.aMediaSrc;
        }

        this.questions[cIndex][qIndex] = {
          question: qText,
          answer: aText,
          points: points,
          qMedia: qMediaSrc ? { type: qMediaType, src: qMediaSrc } : null,
          aMedia: aMediaSrc ? { type: aMediaType, src: aMediaSrc } : null
        };
      });
    });
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

    const maxRows = Math.max(...Object.values(this.questions).map(cat => Object.keys(cat).length));

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

    this.renderModalMedia('question-media-container', data.qMedia?.type, data.qMedia?.src);
    document.getElementById('answer-text').textContent = data.answer;
    this.renderModalMedia('answer-media-container', data.aMedia?.type, data.aMedia?.src);

    document.getElementById('answer-section').classList.add('hidden');
    document.getElementById('show-answer').style.display = 'inline-block';

    this.generateTeamButtons();
    document.getElementById('question-modal').style.display = 'block';
  }

  renderModalMedia(containerId, type, src) {
    const cont = document.getElementById(containerId);
    cont.innerHTML = '';
    if (!type || !src) return cont.classList.add('hidden');

    let el;
    if (type === 'image') {
      el = document.createElement('img');
      el.src = src;
      el.className = 'modal-media zoomable';
      el.addEventListener('click', () => el.classList.toggle('zoomed'));
    } else if (type === 'audio') {
      el = document.createElement('audio');
      el.src = src;
      el.controls = true;
    } else if (type === 'video') {
      el = document.createElement('video');
      el.src = src;
      el.controls = true;
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
    const points = this.currentQuestion.data.points;
    if (isCorrect) this.teams[teamIndex].score += points;
    else this.teams[teamIndex].score -= points;

    document.getElementById(`score-${teamIndex}`).textContent = this.teams[teamIndex].score;
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