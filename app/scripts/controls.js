export function makeNoteCtrl({
  storageKeys: store_keys,
  defaultNoteContent: def_html,
  emptyParagraph: empty_p,
  dom,
  texting: txt,
  setSavingState: set_save
}) {
  const {
    title_in,
    note_list,
    empty_box,
    filt_in,
    edit_area,
    dup_btn,
    del_btn,
    new_btn,
    note_tpl
  } = dom;

  const has_rel =
    typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat === "function";
  const rel_fmt = has_rel
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    : null;

  let note_set = [];
  let active_id = null;
  let save_timer = null;

  function makeId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(store_keys.notes) || "null");
      if (Array.isArray(stored) && stored.length) {
        note_set = stored.map(norm);
      } else {
        note_set = [makeNote("new note", def_html)];
      }
    } catch (err) {
      console.error("Failed to load stored notes:", err);
      note_set = [makeNote("new note", def_html)];
    }
  }

  function norm(note) {
    return {
      id: note.id || makeId(),
      title: String(note.title || "Untitled"),
      content: String(note.content || ""),
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString(),
      meta: note.meta || {}
    };
  }

  function persist({ debounce = false } = {}) {
    if (debounce) {
      if (save_timer) {
        clearTimeout(save_timer);
      }
      set_save("<i class='fas fa-hourglass-half'></i>");
      save_timer = setTimeout(() => persist({ debounce: false }), 450);
      return;
    }
    try {
      localStorage.setItem(store_keys.notes, JSON.stringify(note_set));
      set_save("<i class='fas fa-check'></i>");
    } catch (err) {
      set_save("<i class='fas fa-exclamation-triangle'></i>");
    }
  }

  function makeNote(title = "untitled note", content = empty_p) {
    const stamp = new Date().toISOString();
    return {
      id: makeId(),
      title,
      content,
      createdAt: stamp,
      updatedAt: stamp,
      meta: {}
    };
  }

  function grabActive() {
    return note_set.find((note) => note.id === active_id) || null;
  }

  function current() {
    const note = grabActive();
    if (!note) {
      return null;
    }
    return { ...note };
  }

  function pick(id, { focusEditor = true } = {}) {
    const note = note_set.find((entry) => entry.id === id);
    if (!note) {
      return;
    }
    active_id = note.id;
    localStorage.setItem(store_keys.lastSelected, active_id);
    syncButtons();
    draw();
    title_in.value = note.title;
    edit_area.innerHTML = note.content || empty_p;
    txt.syncWords();
    txt.syncFmt();
    if (focusEditor) {
      edit_area.focus();
    }
  }

  function syncButtons() {
    const has_pick = Boolean(active_id);
    dup_btn.disabled = !has_pick;
    del_btn.disabled = !has_pick;
  }

  function draw() {
    const keyword = filt_in.value.toLowerCase().trim();
    note_set.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    note_list.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (const note of note_set) {
      if (keyword && !match(note, keyword)) {
        continue;
      }
      const clone = note_tpl.content.firstElementChild.cloneNode(true);
      const btn = clone.querySelector("button");
      btn.dataset.id = note.id;
      btn.querySelector(".ntitle").textContent = note.title || "untitled";
      btn.querySelector(".mupd").textContent = stamp(note.updatedAt);
      btn.querySelector(".mlen").textContent = fmtChars(note.content);
      if (note.id === active_id) {
        btn.classList.add("is-active");
      }
      frag.appendChild(clone);
    }

    note_list.appendChild(frag);
    empty_box.hidden = note_list.children.length > 0;
  }

  function match(note, keyword) {
    const plain = txt.plain(note.content).toLowerCase();
    return note.title.toLowerCase().includes(keyword) || plain.includes(keyword);
  }

  function stamp(iso) {
    if (!has_rel || !rel_fmt) {
      return new Date(iso).toLocaleString();
    }
    const date = new Date(iso);
    const diff = date.getTime() - Date.now();
    const seconds = Math.round(diff / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (Math.abs(days) >= 1) {
      return rel_fmt.format(days, "day");
    }
    if (Math.abs(hours) >= 1) {
      return rel_fmt.format(hours, "hour");
    }
    if (Math.abs(minutes) >= 1) {
      return rel_fmt.format(minutes, "minute");
    }
    return "just now";
  }

  function fmtChars(html) {
    const plain = txt.plain(html || "");
    const count = plain.length;
    return `${count} char${count === 1 ? "" : "s"}`;
  }

  function editInput() {
    const note = grabActive();
    if (!note) {
      return;
    }
    const clean = txt.cleanHtml(edit_area.innerHTML);
    if (clean !== edit_area.innerHTML) {
      edit_area.innerHTML = clean;
    }
    note.content = clean;
    note.updatedAt = new Date().toISOString();
    txt.syncWords();
    draw();
    persist({ debounce: true });
  }

  function titleChange() {
    const note = grabActive();
    if (!note) {
      return;
    }
    const next = title_in.value.trim() || "untitled";
    note.title = next;
    note.updatedAt = new Date().toISOString();
    draw();
    persist({ debounce: true });
  }

  function titleKey(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      edit_area.focus();
    }
  }

  function listClick(event) {
    const btn = event.target.closest("button");
    if (!btn || !btn.dataset.id) {
      return;
    }
    pick(btn.dataset.id);
  }

  function addNote() {
    const note = makeNote("new note", empty_p);
    note_set.unshift(note);
    draw();
    pick(note.id);
    persist({ debounce: true });
  }

  function cloneNote() {
    const source = grabActive();
    if (!source) {
      return;
    }
    const clone = makeNote(`${source.title} (copy)`, source.content);
    note_set.unshift(clone);
    draw();
    pick(clone.id);
    persist({ debounce: true });
  }

  function dropNote(event) {
    const note = grabActive();
    if (!note) {
      return;
    }
    const bypassConfirm = event && event.shiftKey;
    if (!bypassConfirm && !confirm("Are you sure you want to delete this note, FOREVER??")) {
      return;
    }
    note_set = note_set.filter((entry) => entry.id !== note.id);
    if (!note_set.length) {
      note_set = [makeNote("new note", empty_p)];
    }
    const fallback = note_set[0].id;
    draw();
    pick(fallback);
    persist({ debounce: true });
  }

  function filterNotes() {
    draw();
  }

  function init() {
    load();
    const last = localStorage.getItem(store_keys.lastSelected);
    const first =
      last && note_set.some((note) => note.id === last) ? last : note_set[0].id;
    draw();
    pick(first, { focusEditor: false });
    txt.syncWords();
    txt.syncFmt();
    set_save("<i class='fas fa-check'></i>");
    txt.onCmd(editInput);
  }

  function bind() {
    note_list.addEventListener("click", listClick);
    new_btn.addEventListener("click", addNote);
    dup_btn.addEventListener("click", cloneNote);
    del_btn.addEventListener("click", dropNote);
    filt_in.addEventListener("input", filterNotes);
    title_in.addEventListener("input", titleChange);
    title_in.addEventListener("keydown", titleKey);
    edit_area.addEventListener("input", editInput);
    edit_area.addEventListener("keyup", txt.syncFmt);
    document.addEventListener("selectionchange", () => {
      if (txt.hasSel()) {
        txt.syncFmt();
      }
    });
  }

  return {
    init,
    bind,
    make: addNote,
    current
  };
}
