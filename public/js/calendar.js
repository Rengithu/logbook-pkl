/* ---------------- Google Calendar Custom Date Picker ---------------- */
const datePicker = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0 - 11
  selectedDateStr: '', // 'YYYY-MM-DD'
  monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],

  init() {
    this.wrapper = $('#datePickerWrapper');
    this.trigger = $('#datePickerTrigger');
    this.popover = $('#datePickerPopover');
    this.input = $('#tanggal');
    this.displayText = $('#tanggalDisplayText');
    this.monthYearEl = $('#dpMonthYear');
    this.daysGridEl = $('#dpDaysGrid');
    this.prevBtn = $('#dpPrevMonth');
    this.nextBtn = $('#dpNextMonth');
    this.todayBtn = $('#dpTodayBtn');
    this.closeBtn = $('#dpCloseBtn');

    if (!this.wrapper) return;

    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });

    this.prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewMonth--;
      if (this.viewMonth < 0) {
        this.viewMonth = 11;
        this.viewYear--;
      }
      this.render();
    });

    this.nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.viewMonth++;
      if (this.viewMonth > 11) {
        this.viewMonth = 0;
        this.viewYear++;
      }
      this.render();
    });

    this.todayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const now = new Date();
      const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      this.setDate(str);
      this.close();
    });

    this.closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });

    document.addEventListener('click', (e) => {
      if (this.wrapper && !this.wrapper.contains(e.target)) {
        this.close();
      }
    });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    this.setDate(todayStr);
  },

  open() {
    this.wrapper.classList.add('open');
    this.popover.classList.add('open');
    this.render();
  },

  close() {
    this.wrapper.classList.remove('open');
    this.popover.classList.remove('open');
  },

  toggle() {
    if (this.popover.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  },

  setDate(dateStr) {
    if (!dateStr) return;
    this.selectedDateStr = dateStr;
    this.input.value = dateStr;

    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    this.viewYear = y;
    this.viewMonth = m - 1;

    const dayName = this.dayNames[dt.getDay()];
    const monthName = this.monthNames[m - 1];
    this.displayText.textContent = `${dayName}, ${d} ${monthName} ${y}`;

    // Update Holiday Info Box
    const hol = getHoliday(dateStr);
    const dayOfWeek = dt.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holEl = $('#holidayInfo');
    if (holEl) {
      if (hol) {
        holEl.style.display = 'inline-flex';
        holEl.className = `holiday-info-box ${hol.type === 'bali' ? 'is-bali' : 'is-national'}`;
        const iconName = hol.type === 'bali' ? 'temple_hindu' : 'celebration';
        holEl.innerHTML = `<span class="material-symbols-outlined">${iconName}</span> <span>${hol.type === 'bali' ? 'Hari Raya / Rerainan Bali' : 'Hari Libur Nasional'}: ${escapeHtml(hol.name)}</span>`;
      } else if (isWeekend) {
        holEl.style.display = 'inline-flex';
        holEl.className = 'holiday-info-box is-weekend';
        const dayName = dayOfWeek === 6 ? 'Sabtu' : 'Minggu';
        holEl.innerHTML = `<span class="material-symbols-outlined">weekend</span> <span>Hari ${dayName} (Akhir Pekan - Libur)</span>`;
      } else {
        holEl.style.display = 'none';
        holEl.innerHTML = '';
      }
    }

    if (this.popover.classList.contains('open')) {
      this.render();
    }
  },

  render() {
    this.monthYearEl.textContent = `${this.monthNames[this.viewMonth]} ${this.viewYear}`;
    this.daysGridEl.innerHTML = '';

    const firstDayIndex = new Date(this.viewYear, this.viewMonth, 1).getDay(); // 0 = Sunday
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 = Monday
    const lastDate = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const prevLastDate = new Date(this.viewYear, this.viewMonth, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = startDay; i > 0; i--) {
      const dayNum = prevLastDate - i + 1;
      const cell = document.createElement('div');
      cell.className = 'dp-day other-month';
      cell.textContent = dayNum;
      this.daysGridEl.appendChild(cell);
    }

    for (let i = 1; i <= lastDate; i++) {
      const cell = document.createElement('div');
      cell.className = 'dp-day';
      cell.textContent = i;

      const curDateStr = `${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const curDt = new Date(this.viewYear, this.viewMonth, i);
      const isWeekendDay = curDt.getDay() === 0 || curDt.getDay() === 6;
      const hol = getHoliday(curDateStr);

      if (isWeekendDay) {
        cell.classList.add('sunday');
      }


      if (hol) {
        cell.classList.add('holiday');
        cell.title = `${hol.name} (${hol.type === 'bali' ? 'Rerainan/Libur Bali' : 'Libur Nasional'})`;
      }

      if (curDateStr === this.selectedDateStr) {
        cell.classList.add('selected');
      }
      if (curDateStr === todayStr) {
        cell.classList.add('today');
      }

      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setDate(curDateStr);
        this.close();
      });

      this.daysGridEl.appendChild(cell);
    }

    const totalCells = startDay + lastDate;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const cell = document.createElement('div');
      cell.className = 'dp-day other-month';
      cell.textContent = i;
      this.daysGridEl.appendChild(cell);
    }
  }
};


function switchToTab(tabName) {
  $$('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));
  $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${tabName}`));
}

async function checkProfileFilled() {
  const profile = await api('/api/profile');
  state.profile = profile || {};
  const filled = profile.namaPeserta && profile.tempatPkl && profile.namaInstruktur && profile.namaPembimbing;
  if (!filled) {
    toast('Lengkapi dulu identitas agar laporan menampilkan data yang benar');
    openProfileModal();
  }
}

