(() => {
  let programsData = null;
  let currentProgram = 'cs';

  // Load programs data
  async function loadPrograms() {
    try {
      const response = await fetch('programs.json');
      const data = await response.json();
      programsData = data;
      
      // Build program map for quick access
      window.PROGRAMS = {};
      data.programs.forEach(prog => {
        window.PROGRAMS[prog.id] = prog;
      });

      // Initialize with default program
      renderProgram('cs');
      attachTabListeners();
    } catch (error) {
      console.error('Failed to load programs:', error);
      document.getElementById('programContent').innerHTML = '<p style="color: red;">Failed to load programs. Please refresh.</p>';
    }
  }

  function attachTabListeners() {
    document.querySelectorAll('.program-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const programId = tab.dataset.program;
        switchProgram(programId);
      });
    });
  }

  function switchProgram(programId) {
    // Update active tab
    document.querySelectorAll('.program-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.program === programId);
    });

    currentProgram = programId;
    localStorage.setItem('selectedProgram', programId);
    renderProgram(programId);
  }

  function renderProgram(programId) {
    const program = window.PROGRAMS[programId];
    if (!program) return;

    const contentArea = document.getElementById('programContent');
    
    // Program header
    let html = `
      <div class="program-header" style="border-left: 4px solid ${program.color}">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px">
          <i class="fas ${program.icon}" style="font-size: 1.8em; color: ${program.color}"></i>
          <div>
            <h1 style="margin: 0; color: ${program.color}">${program.name}</h1>
            <p style="margin: 4px 0 0; color: var(--muted); font-size: 0.95rem">${program.description}</p>
          </div>
        </div>
      </div>

      <div class="semesters-container">
    `;

    // Render semesters
    program.semesters.forEach((sem, semIndex) => {
      html += `
        <div class="semester-group">
          <div class="semester-header">
            <h3><i class="fas fa-calendar-alt"></i> Year ${sem.year}, Semester ${sem.semester}</h3>
            <span class="course-count">${sem.courses.length} courses</span>
          </div>
          <div class="courses-grid">
      `;

      // Render courses
      sem.courses.forEach(course => {
        html += `
          <div class="course-card">
            <div class="course-header">
              <h4 class="course-code">${course.code}</h4>
              <h4 class="course-name">${course.name}</h4>
            </div>
            <div class="course-resources">
              <div class="resources-list">
        `;

        // Render resources
        course.resources.forEach(resource => {
          const icons = {
            'video': 'fas fa-play-circle',
            'article': 'fas fa-newspaper',
            'tool': 'fas fa-wrench',
            'book': 'fas fa-book'
          };
          const typeColors = {
            'video': '#ef4444',
            'article': '#3b82f6',
            'tool': '#10b981',
            'book': '#8b5cf6'
          };

          html += `
            <a href="${resource.url}" target="_blank" rel="noopener noreferrer" class="resource-item" style="border-left-color: ${typeColors[resource.type]}">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1">
                <i class="fas ${icons[resource.type]}" style="color: ${typeColors[resource.type]}; min-width: 16px"></i>
                <div style="flex: 1">
                  <div class="resource-title">${resource.title}</div>
                  <div class="resource-source">${resource.source}</div>
                </div>
              </div>
              <i class="fas fa-external-link-alt" style="color: var(--muted); font-size: 0.9rem"></i>
            </a>
          `;
        });

        html += `
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;

    contentArea.innerHTML = html;
  }

  // Restore last selected program
  function restoreProgram() {
    const saved = localStorage.getItem('selectedProgram');
    if (saved && window.PROGRAMS && window.PROGRAMS[saved]) {
      switchProgram(saved);
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPrograms);
  } else {
    loadPrograms();
  }

  // Restore on page show
  window.addEventListener('pageshow', restoreProgram);

})();
