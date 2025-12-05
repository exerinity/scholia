import { makeTxt } from "./texting.js";
import { makeNoteCtrl } from "./controls.js";

const store_keys = {
  notes: "notepad:pwa:notes",
  theme: "notepad:pwa:theme",
  lastSelected: "notepad:pwa:selected"
};

const def_note_html = "<p></p>";
const empty_p = "<p></p>";

const els = {
  title_in: document.getElementById("title_in"),
  note_list: document.getElementById("note_list"),
  empty_box: document.getElementById("empty_box"),
  filt_in: document.getElementById("filt_in"),
  edit_area: document.getElementById("edit_area"),
  save_lbl: document.getElementById("save_lbl"),
  conn_tag: document.getElementById("conn_tag"),
  word_lbl: document.getElementById("word_lbl"),
  theme_btn: document.getElementById("theme_btn"),
  ins_btn: document.getElementById("ins_btn"),
  dup_btn: document.getElementById("dup_btn"),
  del_btn: document.getElementById("del_btn"),
  new_btn: document.getElementById("new_btn"),
  font_sel: document.getElementById("font_sel"),
  size_sel: document.getElementById("size_sel"),
  clr_btn: document.getElementById("clr_btn"),
  exp_html_btn: document.getElementById("exp_html_btn"),
  note_tpl: document.getElementById("note_tpl"),
  menu_btn: document.getElementById("menu_btn"),
  nav_layer: document.getElementById("nav_layer")
};

const fmt_btns = Array.from(
  document.querySelectorAll(".fbtn[data-command]")
);
const align_btns = Array.from(
  document.querySelectorAll(".fbtn[data-alignment]")
);

const pend = {
  install: null
};

const txt = makeTxt({
  editor: els.edit_area,
  wordCountElement: els.word_lbl,
  formatButtons: fmt_btns,
  alignmentButtons: align_btns,
  fontFamilySelect: els.font_sel,
  fontSizeSelect: els.size_sel,
  emptyParagraph: empty_p
});

const note_ctrl = makeNoteCtrl({
  storageKeys: store_keys,
  defaultNoteContent: def_note_html,
  emptyParagraph: empty_p,
  dom: {
    title_in: els.title_in,
    note_list: els.note_list,
    empty_box: els.empty_box,
    filt_in: els.filt_in,
    edit_area: els.edit_area,
    dup_btn: els.dup_btn,
    del_btn: els.del_btn,
    new_btn: els.new_btn,
    note_tpl: els.note_tpl
  },
  texting: txt,
  setSavingState: (msg) => {
    els.save_lbl.innerHTML = msg;
  }
});

note_ctrl.init();
note_ctrl.bind();

fmt_btns.forEach((btn) => {
  const cmd = btn.dataset.command;
  if (!cmd) {
    return;
  }
  btn.addEventListener("click", () => {
    txt.apply(cmd);
  });
});

els.font_sel.addEventListener("change", (event) => {
  txt.apply("fontName", event.target.value);
});

els.size_sel.addEventListener("change", (event) => {
  txt.apply("fontSize", event.target.value);
});

els.clr_btn.addEventListener("click", () => {
  txt.apply("removeFormat");
});

function sanitizeFileName(name) {
  const base = (name || "untitled").toString().trim();
  const cleaned = base
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || "untitled";
}

function exportActiveAsHtml() {
  if (!note_ctrl || typeof note_ctrl.current !== "function") {
    return;
  }
  const note = note_ctrl.current();
  if (!note) {
    return;
  }
  const title = sanitizeFileName(note.title || "untitled");
  const content = txt.cleanHtml(note.content || "");
  const doc = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${title} - why.txt</title>\n<meta name="generator" content="why.txt">\n<style>
    html, body { background: #000000ff; color: #ffffffff; }
    body { max-width: 720px; margin: 2rem auto; padding: 0 1rem; font: 16px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
    .note-title { margin: 0 0 1rem 0; font-size: 1.75rem; line-height: 1.2; }
    .note-meta { color: #d3d3d3ff; font-size: .9rem; margin-bottom: 1.25rem; }
    .note-content :is(p, ul, ol, pre, blockquote) { margin: 1rem 0; }
    .note-content pre { background: #000000ff; padding: .75rem; border-radius: 6px; overflow: auto; }
    .note-content code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    .note-content blockquote { border-left: 4px solid #ddd; padding: .25rem .75rem; color: #555; }
    .note-footer { margin-top: 2rem; font-size: .85rem; color: #d3d3d3ff; }
    .note-footer a { color: inherit; text-decoration: none; border-bottom: 1px dotted currentColor; }
    .note-footer a:hover { text-decoration: underline; }
  </style>\n</head>\n<body>\n<h1 class="note-title"></h1>\n<article class="note-content">${content}</article>\n<footer class="note-footer"><a href="https://why.exerinity.com" target="_blank" rel="noopener noreferrer">why.txt</a></footer>\n</body>\n</html>`;

  try {
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error("Failed to export HTML:", err);
  }
}

if (els.exp_html_btn) {
  els.exp_html_btn.addEventListener("click", exportActiveAsHtml);
}

function useTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.body.setAttribute("data-theme", next);
  localStorage.setItem(store_keys.theme, next);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const color = next === "dark" ? "#0f0f0f" : "#ffffff";
    meta.setAttribute("content", color);
  }
  els.theme_btn.textContent = next === "dark" ? "Lumos!" : "Nox!";
}

function pullTheme() {
  const saved = localStorage.getItem(store_keys.theme);
  const prefer =
    saved ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  useTheme(prefer);
}

function flipTheme() {
  const current = document.body.getAttribute("data-theme");
  useTheme(current === "dark" ? "light" : "dark");
}

els.theme_btn.addEventListener("click", flipTheme);

function syncConn() {
  const online = navigator.onLine;
  els.conn_tag.textContent = online ? "online" : "offline";
  els.conn_tag.classList.toggle("on", online);
  els.conn_tag.classList.toggle("off", !online);
}

window.addEventListener("online", syncConn);
window.addEventListener("offline", syncConn);

function catchInstall(event) {
  event.preventDefault();
  pend.install = event;
  els.ins_btn.hidden = false;
}

function doInstall() {
  if (!pend.install) {
    return;
  }
  pend.install.prompt();
  pend.install.userChoice.finally(() => {
    pend.install = null;
    els.ins_btn.hidden = true;
  });
}

window.addEventListener("beforeinstallprompt", catchInstall);
els.ins_btn.addEventListener("click", doInstall);

function keyHooks(event) {
  const platform = navigator.platform || "";
  const isMac = platform.toUpperCase().includes("MAC");
  const mod = isMac ? event.metaKey : event.ctrlKey;

  if (event.altKey && !mod && !event.shiftKey) {
    switch (event.code) {
      case "KeyN": {
        event.preventDefault();
        note_ctrl.make();
        return;
      }
      case "Insert": {
        event.preventDefault();
        note_ctrl.make();
        return;
      }
      case "Delete": {
        if (els.del_btn && !els.del_btn.disabled) {
          event.preventDefault();
          els.del_btn.click();
        }
        return;
      }
      case "KeyS": {
        if (els.filt_in) {
          event.preventDefault();
          els.filt_in.focus();
          if (typeof els.filt_in.select === "function") {
            els.filt_in.select();
          }
        }
        return;
      }
      case "KeyY": {
        if (els.title_in) {
          event.preventDefault();
          els.title_in.focus();
          if (typeof els.title_in.select === "function") {
            els.title_in.select();
          }
        }
        return;
      }
      default:
        break;
    }
  }

  if (!mod) {
    return;
  }

  const wantsSearch = !event.altKey && !event.shiftKey && event.code === "KeyK";
  if (wantsSearch && els.filt_in) {
    event.preventDefault();
    els.filt_in.focus();
    if (typeof els.filt_in.select === "function") {
      els.filt_in.select();
    }
    return;
  }

  if (!event.altKey || !event.shiftKey) {
    return;
  }

  if (event.code === "KeyN") {
    event.preventDefault();
    note_ctrl.make();
  }
}

window.addEventListener("keydown", keyHooks);

function initSw() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }
}

const nav_support = Boolean(els.menu_btn && els.nav_layer);
let nav_open = false;

function setNav(state) {
  nav_open = state;
  if (nav_open) {
    document.body.setAttribute("data-nav", "open");
  } else {
    document.body.removeAttribute("data-nav");
  }
  if (els.menu_btn) {
    els.menu_btn.setAttribute("aria-expanded", nav_open ? "true" : "false");
    els.menu_btn.setAttribute(
      "aria-label",
      nav_open ? "Close navigation" : "Open navigation"
    );
    const icon = els.menu_btn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !nav_open);
      icon.classList.toggle("fa-xmark", nav_open);
    }
  }
  if (els.nav_layer) {
    els.nav_layer.setAttribute("aria-hidden", nav_open ? "false" : "true");
  }
}

function toggleNav(force) {
  const next = typeof force === "boolean" ? force : !nav_open;
  setNav(next);
}

if (nav_support) {
  setNav(false);
  const mq_mobile = window.matchMedia("(max-width: 780px)");

  els.menu_btn.addEventListener("click", () => {
    toggleNav();
  });

  els.nav_layer.addEventListener("click", () => {
    toggleNav(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav_open) {
      toggleNav(false);
    }
  });

  if (els.note_list) {
    els.note_list.addEventListener("click", () => {
      if (mq_mobile.matches) {
        toggleNav(false);
      }
    });
  }

  [els.new_btn, els.dup_btn, els.del_btn].forEach((node) => {
    if (!node) {
      return;
    }
    node.addEventListener("click", () => {
      if (mq_mobile.matches) {
        toggleNav(false);
      }
    });
  });

  const closeNavOnWide = () => {
    if (!mq_mobile.matches) {
      toggleNav(false);
    }
  };

  if (typeof mq_mobile.addEventListener === "function") {
    mq_mobile.addEventListener("change", closeNavOnWide);
  } else if (typeof mq_mobile.addListener === "function") {
    mq_mobile.addListener(closeNavOnWide);
  }
  window.addEventListener("resize", closeNavOnWide);
}

pullTheme();
syncConn();
initSw();
