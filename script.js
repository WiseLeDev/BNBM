/* ================= INIT UI & APPTS ================= */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookingForm');
  const appointmentsEl = document.getElementById('appointments');
  const yearSpan = document.getElementById('year');
  const exportIcsBtn = document.getElementById('exportIcs');
  const themeToggle = document.getElementById('themeToggle');

  yearSpan.textContent = new Date().getFullYear();

  function loadAppointments(){ return JSON.parse(localStorage.getItem('rdv')||'[]'); }
  function saveAppointments(a){ localStorage.setItem('rdv', JSON.stringify(a)); }

  function renderAppointments(){
    const list = loadAppointments();
    appointmentsEl.innerHTML = '';
    if(list.length===0){
      appointmentsEl.innerHTML = '<p style="color:var(--muted)">Aucun rendez-vous pour le moment.</p>';
      return;
    }
    list.forEach((r, i) => {
      const div = document.createElement('div');
      div.className='rdv-item';
      div.innerHTML = `<strong>${r.date}</strong> à <strong>${r.time}</strong> — ${r.service} pour ${r.name}
        <div style="margin-top:6px"><button data-idx="${i}" class="btn ghost small">Annuler</button></div>`;
      appointmentsEl.appendChild(div);
    });
    // cancel handlers
    appointmentsEl.querySelectorAll('button[data-idx]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const idx = Number(e.currentTarget.dataset.idx);
        const arr = loadAppointments(); arr.splice(idx,1); saveAppointments(arr); renderAppointments();
      });
    });
  }

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const service = document.getElementById('service').value;
    if(!name||!date||!time||!service){ alert('Veuillez remplir tous les champs.'); return; }
    const arr = loadAppointments();
    arr.push({name,email,date,time,service,id:Date.now()});
    saveAppointments(arr);
    form.reset(); renderAppointments();
    showToast(`RDV confirmé le ${date} à ${time}`);
  });

  exportIcsBtn.addEventListener('click', ()=>{
    const appts = loadAppointments();
    if(appts.length===0){ alert('Aucun RDV à exporter'); return; }
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//OnglesDor//FR'];
    appts.forEach(a=>{
      const start = toUTCDateTime(a.date, a.time);
      const uid = `${a.id}@onglesdor`;
      lines.push('BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${nowUTC()}`,`DTSTART:${start}`,`DTEND:${start}`,`SUMMARY:RDV ${a.service}`,`DESCRIPTION:${a.name} — ${a.email || ''}`,'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], {type:'text/calendar'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'rdv-ongles.ics'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  });

  function pad(n){return String(n).padStart(2,'0')}
  function toUTCDateTime(dateStr, timeStr){
    const d = new Date(dateStr + 'T' + (timeStr.length===5? timeStr+':00': timeStr));
    const y = d.getUTCFullYear(), m=pad(d.getUTCMonth()+1), day=pad(d.getUTCDate()), hh=pad(d.getUTCHours()), mm=pad(d.getUTCMinutes());
    return `${y}${m}${day}T${hh}${mm}00Z`;
  }
  function nowUTC(){ return new Date().toISOString().replace(/[-:.]/g,'').slice(0,15)+'Z' }

  function showToast(msg){
    const t = document.createElement('div'); t.className='toast shimmer'; t.textContent=msg;
    Object.assign(t.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'26px',padding:'10px 16px',borderRadius:'10px',zIndex:9999});
    document.body.appendChild(t); setTimeout(()=>t.remove(),3200);
  }

  renderAppointments();

  /* ====== SLIDER (auto fade) ====== */
  let slideIndex = 0;
  const slides = Array.from(document.querySelectorAll('.slider .slide'));
  const dots = Array.from(document.querySelectorAll('.slider-controls .dot'));

  function showSlide(i){
    slides.forEach((s, idx)=> s.classList.toggle('visible', idx===i));
    dots.forEach((d, idx)=> d.classList.toggle('active', idx===i));
  }
  function nextSlide(){ slideIndex = (slideIndex + 1) % slides.length; showSlide(slideIndex); }
  if(slides.length>0){
    showSlide(0);
    setInterval(nextSlide, 5000);
  }
  dots.forEach((dot, idx)=> dot.addEventListener('click', ()=>{ slideIndex=idx; showSlide(idx); }));

  /* ====== LIGHTBOX ====== */
  const lightbox = document.getElementById('lightbox');
  const closeLb = document.getElementById('closeLb');
  document.querySelectorAll('.gl-img').forEach(img=>{
    img.addEventListener('click', ()=> {
      lightbox.querySelector('img').src = img.src;
      lightbox.classList.remove('hidden'); lightbox.setAttribute('aria-hidden','false');
    });
  });
  closeLb?.addEventListener('click', ()=> { lightbox.classList.add('hidden'); lightbox.setAttribute('aria-hidden','true'); });
  lightbox?.addEventListener('click', (e)=> { if(e.target===lightbox) { lightbox.classList.add('hidden'); lightbox.setAttribute('aria-hidden','true'); }});
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ lightbox.classList.add('hidden'); lightbox.setAttribute('aria-hidden','true'); }});

  /* ====== PROGRESS BAR ====== */
  const progressBar = document.querySelector('.progress-bar');
  window.addEventListener('scroll', ()=>{
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop/docHeight)*100 : 0;
    progressBar.style.width = pct + '%';
  });

  /* ====== THEME (Doré clair) ====== */
  const savedTheme = localStorage.getItem('theme');
  if(savedTheme === 'light') document.body.classList.add('light'), themeToggle.textContent='☀︎';
  themeToggle.addEventListener('click', ()=>{
    const isLight = document.body.classList.toggle('light');
    themeToggle.textContent = isLight ? '☀︎' : '☾';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    // small rotate animation
    themeToggle.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],{duration:420});
  });

  /* ====== Fade-in on scroll ====== */
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting) en.target.classList.add('visible'); });
  }, {threshold:0.12});
  document.querySelectorAll('.fade-in').forEach(el=>observer.observe(el));
});
