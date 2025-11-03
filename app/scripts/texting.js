const cmd_ok = typeof document.queryCommandSupported === "function";

export function makeTxt({
  editor: edit_area,
  wordCountElement: word_node,
  formatButtons: fmt_btns,
  alignmentButtons: align_btns,
  fontFamilySelect: font_sel,
  fontSizeSelect: size_sel,
  emptyParagraph: empty_p
}) {
  const cmd_hooks = new Set();

  function onCmd(fn) {
    if (typeof fn === "function") {
      cmd_hooks.add(fn);
    }
  }

  function fireHooks() {
    if (!cmd_hooks.size) {
      return;
    }
    for (const hook of cmd_hooks) {
      try {
        hook();
      } catch (err) {
        console.error("command callback failed:", err);
      }
    }
  }

  function apply(cmd, value = null) {
    if (typeof document.execCommand !== "function") {
      return;
    }
    let ok = true;
    if (cmd_ok) {
      try {
        ok = document.queryCommandSupported(cmd);
      } catch (_err) {
        ok = true;
      }
    }
    if (!ok && cmd !== "undo" && cmd !== "redo") {
      console.warn(`command \"${cmd}\" is not supported in this browser`);
      return;
    }
    edit_area.focus();
    document.execCommand(cmd, false, value);
    fireHooks();
    setTimeout(() => {
      syncFmt();
      syncWords();
    }, 0);
  }

  function syncFmt() {
    if (!cmd_ok) {
      return;
    }
    for (const btn of fmt_btns) {
      const cmd = btn.dataset.command;
      if (!cmd) {
        continue;
      }
      let pressed = false;
      try {
        pressed = document.queryCommandState(cmd);
      } catch (_err) {
        pressed = false;
      }
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    }

    const align_map = {
      justifyLeft: false,
      justifyCenter: false,
      justifyRight: false,
      justifyFull: false
    };

    for (const key of Object.keys(align_map)) {
      try {
        align_map[key] = document.queryCommandState(key);
      } catch (_err) {
        align_map[key] = false;
      }
    }

    for (const btn of align_btns) {
      const cmd = btn.dataset.command;
      if (!cmd) {
        continue;
      }
      const active = align_map[cmd] || false;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }

    try {
      const font = (document.queryCommandValue("fontName") || "").replace(/["']/g, "");
      syncSelect(font_sel, font);
    } catch (_err) {
      font_sel.value = "inherit";
    }

    try {
      const size = document.queryCommandValue("fontSize") || "3";
      syncSelect(size_sel, String(size));
    } catch (_err) {
      size_sel.value = "3";
    }
  }

  function syncSelect(select, target) {
    if (!select) {
      return;
    }
    const options = Array.from(select.options);
    const lowered = target.toLowerCase();
    const exact = options.find((opt) => opt.value.toLowerCase() === lowered);
    if (exact) {
      select.value = exact.value;
      return;
    }
    const partial = options.find((opt) =>
      lowered.includes(opt.value.split(",")[0].toLowerCase())
    );
    if (partial) {
      select.value = partial.value;
      return;
    }
    select.value = options[0]?.value || "";
  }

  function cleanHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    cleanNode(doc.body);
    return doc.body.innerHTML || empty_p;
  }

  function cleanNode(node) {
    const allow_tags = [
      "P",
      "BR",
      "DIV",
      "SPAN",
      "B",
      "I",
      "U",
      "S",
      "STRONG",
      "EM",
      "UL",
      "OL",
      "LI",
      "BLOCKQUOTE",
      "PRE",
      "CODE",
      "HR",
      "FONT"
    ];
    const allow_attr = ["style", "face", "size"];
    const remove = [];
    for (const child of Array.from(node.children)) {
      if (!allow_tags.includes(child.tagName)) {
        while (child.firstChild) {
          child.parentNode.insertBefore(child.firstChild, child);
        }
        remove.push(child);
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        if (!allow_attr.includes(attr.name.toLowerCase())) {
          child.removeAttribute(attr.name);
        }
      }
      cleanNode(child);
    }
    for (const kid of remove) {
      kid.remove();
    }
  }

  function plain(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  function syncWords() {
    if (!word_node) {
      return;
    }
    const text = plain(edit_area.innerHTML)
      .replace(/\s+/g, " ")
      .trim();
    const words = text ? text.split(" ").length : 0;
    word_node.textContent = `${words} word${words === 1 ? "" : "s"}`;
  }

  function hasSel() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return false;
    }
    return edit_area.contains(sel.anchorNode);
  }

  return {
    apply,
    syncFmt,
    cleanHtml,
    plain,
    syncWords,
    hasSel,
    onCmd,
    cmd_ok
  };
}

export { cmd_ok };
