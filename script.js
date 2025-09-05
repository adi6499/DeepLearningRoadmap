    // Simple Deep Learning checklist persistence + progress + export/import/reset
    (function(){
      const LS_PREFIX = 'dl-check-';
      const checklist = document.getElementById('checklist');
      const items = checklist.querySelectorAll('.item, .sub');
      const progressFill = document.getElementById('progressFill');
      const progressPercent = document.getElementById('progressPercent');
      const exportBtn = document.getElementById('exportBtn');
      const importBtn = document.getElementById('importBtn');
      const resetBtn = document.getElementById('resetBtn');
      const importFile = document.getElementById('importFile');

      // Assign index keys using data-id attributes
      function allCheckboxes(){
        return Array.from(checklist.querySelectorAll('input[type="checkbox"]'));
      }

      function idForCheckbox(checkbox){
        // parent li has data-id
        let li = checkbox.closest('li');
        if(!li) return null;
        return li.dataset.id || null;
      }

      function saveState(key, val){
        if(!key) return;
        try { localStorage.setItem(LS_PREFIX + key, val ? '1' : '0'); } catch(e){}
      }
      function loadState(key){
        if(!key) return false;
        return localStorage.getItem(LS_PREFIX + key) === '1';
      }

      // restore on load
      allCheckboxes().forEach(cb => {
        const id = idForCheckbox(cb);
        if(id && loadState(id)){
          cb.checked = true;
          cb.closest('li').classList.add('completed');
        }
        cb.addEventListener('change', ()=> {
          const li = cb.closest('li');
          if(cb.checked){ li.classList.add('completed'); } else { li.classList.remove('completed'); }
          saveState(id, cb.checked);
          updateProgress();
        });
      });

      // update progress
      function updateProgress(){
        const cbs = allCheckboxes();
        const total = cbs.length;
        const done = cbs.filter(c=>c.checked).length;
        const pct = total ? Math.round((done/total)*100) : 0;
        progressFill.style.width = pct + '%';
        progressPercent.textContent = pct + '%';
      }
      updateProgress();

      // Export progress
      exportBtn.addEventListener('click', ()=>{
        const cbs = allCheckboxes();
        const data = {};
        cbs.forEach(cb => {
          const id = idForCheckbox(cb);
          if(id) data[id] = cb.checked ? true : false;
        });
        const blob = new Blob([JSON.stringify({progress:data},null,2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deep-learning-progress.json';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      });

      // Import progress via file
      importBtn.addEventListener('click', ()=> importFile.click());
      importFile.addEventListener('change', (e)=>{
        const f = e.target.files[0];
        if(!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          try{
            const parsed = JSON.parse(reader.result);
            if(parsed && parsed.progress){
              Object.entries(parsed.progress).forEach(([id, val])=>{
                const li = checklist.querySelector(`[data-id="${id}"]`);
                if(li){
                  const cb = li.querySelector('input[type="checkbox"]');
                  if(cb){
                    cb.checked = !!val;
                    if(val) li.classList.add('completed'); else li.classList.remove('completed');
                    saveState(id, !!val);
                  }
                }
              });
              updateProgress();
              alert('Progress imported.');
            } else {
              alert('Invalid progress file.');
            }
          } catch(err){
            alert('Failed to parse file.');
          }
        };
        reader.readAsText(f);
        // reset input
        importFile.value = '';
      });

      // Reset
      resetBtn.addEventListener('click', ()=>{
        if(!confirm('Reset all checked items?')) return;
        allCheckboxes().forEach(cb => {
          const id = idForCheckbox(cb);
          if(id) localStorage.removeItem(LS_PREFIX + id);
          cb.checked = false;
          const li = cb.closest('li');
          if(li) li.classList.remove('completed');
        });
        updateProgress();
      });

      // keyboard: focus on '/'
      document.addEventListener('keydown', (e)=>{
        if(e.key === '/' && document.activeElement.tagName !== 'INPUT'){
          e.preventDefault();
          window.scrollTo({top:0, behavior:'smooth'});
        }
      });

      // In case localStorage changes in another tab
      window.addEventListener('storage', ()=>{
        allCheckboxes().forEach(cb => {
          const id = idForCheckbox(cb);
          if(id){
            const val = loadState(id);
            cb.checked = val;
            const li = cb.closest('li');
            if(val) li.classList.add('completed'); else li.classList.remove('completed');
          }
        });
        updateProgress();
      });
    })();