  /* ---------------- FAB Menu Logic ---------------- */
  const fabMenu = $('#fabMenu');
  const btnFabAdd = $('#btnFabAdd');
  btnFabAdd?.addEventListener('click', (e) => {
    e.stopPropagation();
    fabMenu.classList.toggle('open');
    if (fabMenu.classList.contains('open')) {
      btnFabAdd.classList.add('fab-active');
    } else {
      btnFabAdd.classList.remove('fab-active');
    }
  });

  document.addEventListener('click', (e) => {
    if (fabMenu && !fabMenu.contains(e.target) && e.target.closest('#btnFabAdd') === null) {
      fabMenu.classList.remove('open');
      btnFabAdd?.classList.remove('fab-active');
    }
  });

  $('#menuAddEntry')?.addEventListener('click', (e) => {
    e.stopPropagation();
    fabMenu.classList.remove('open');
    resetForm();
    $('#modalAddEntry').classList.add('open');
  });

  $('#menuAddTask')?.addEventListener('click', (e) => {
    e.stopPropagation();
    fabMenu.classList.remove('open');
    $('#modalAddTask .modal-title').textContent = window.t ? window.t('modal.task.titleAdd') : 'Tambah Tugas';
    $('#taskId').value = '';
    $('#formAddTask').reset();
    $('#taskTitle').value = '';
    $('#taskDeadline').value = '';
    $('#taskSubject').value = '';
    $('#taskDescription').value = '';
    $('#taskReferenceUrl').value = '';
    $('#taskAttachment').value = '';
    $('.custom-select-placeholder').textContent = '-- Pilih Mapel --';
    $('.custom-select-placeholder').style.color = 'var(--fg-muted)';
    $('#taskSubjectGroup').style.display = 'block';
    $('#modalAddTask').classList.add('open');
  });

  $('#btnCloseModalAddEntry')?.addEventListener('click', () => {
    closeModal($('#modalAddEntry'));
  });

  $('#btnCancelEdit')?.addEventListener('click', () => {
    closeModal($('#modalAddEntry'));
  });
