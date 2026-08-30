(function () {
  // DOM refs
  const input = document.getElementById("taskInput");
  const addBtn = document.getElementById("addBtn");
  const taskList = document.getElementById("taskList");
  const deleteBtn = document.getElementById("deleteBtn");
  const restartBtn = document.getElementById("restartBtn");
  const sortBtn = document.getElementById("sortBtn");
  const undoBtn = document.getElementById("undoBtn");

  // State
  let focusIndex = -1;
  let selectionAnchor = null;
  const selectedIndices = new Set();

  /* Helpers */
  function getItems() {
    return Array.from(taskList.querySelectorAll("li"));
  }

  function clearSelection() {
    selectedIndices.clear();
    getItems().forEach((li) => li.classList.remove("selected"));
  }

  function setFocus(idx) {
    const list = getItems();
    if (focusIndex >= 0 && list[focusIndex])
      list[focusIndex].classList.remove("focused");
    if (idx < 0 || idx >= list.length) {
      focusIndex = -1;
      return;
    }
    focusIndex = idx;
    list[focusIndex].classList.add("focused");
    list[focusIndex].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function selectRange(a, b) {
    const list = getItems();
    if (a === null) a = 0;
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    clearSelection();
    for (let i = start; i <= end; i++) {
      selectedIndices.add(i);
      list[i].classList.add("selected");
    }
  }

  function toggleSelectIndex(i) {
    const list = getItems();
    if (selectedIndices.has(i)) {
      selectedIndices.delete(i);
      list[i].classList.remove("selected");
    } else {
      selectedIndices.add(i);
      list[i].classList.add("selected");
      selectionAnchor = i;
    }
  }

  function adjustCountForIndex(i, delta) {
    const list = getItems();
    const li = list[i];
    if (!li) return;
    const span = li.querySelector(".count");
    let val = parseInt(span.textContent, 10) || 0;
    val = Math.max(0, val + delta);
    span.textContent = val;
  }
  
  // History (undo) support: save model snapshots before mutations
  const history = [];
  const HISTORY_LIMIT = 100;

  function getModel() {
    return getItems().map((li) => {
      const text = (li.querySelector('.task-content span') || li.querySelector('span')).textContent;
      const count = parseInt((li.querySelector('.count') || { textContent: '0' }).textContent, 10) || 0;
      const cb = li.querySelector("input[type='checkbox']");
      const checked = !!(cb && cb.checked);
      return { text, count, checked };
    });
  }

  function renderModel(model) {
    taskList.innerHTML = '';
    model.forEach((m) => {
      const li = createTaskElement(m.text);
      const cb = li.querySelector("input[type='checkbox']");
      if (cb) cb.checked = !!m.checked;
      const label = li.querySelector('.task-content span') || li.querySelector('span');
      if (label) {
        if (m.checked) label.classList.add('completed');
        else label.classList.remove('completed');
      }
      const span = li.querySelector('.count');
      if (span) span.textContent = String(m.count || 0);
      taskList.appendChild(li);
    });
    clearSelection();
    setFocus(-1);
  }

  function pushHistory() {
    try {
      const snap = JSON.parse(JSON.stringify(getModel()));
      history.push(snap);
      if (history.length > HISTORY_LIMIT) history.shift();
    } catch (e) {
      // ignore
    }
  }

  function undo() {
    if (history.length === 0) return;
    const snap = history.pop();
    renderModel(snap);
  }

  /* Task element creation */
  function createTaskElement(text) {
    const item = document.createElement("li");

    const content = document.createElement("div");
    content.className = "task-content";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const label = document.createElement("span");
    label.textContent = text;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) label.classList.add("completed");
      else label.classList.remove("completed");
    });

    content.appendChild(checkbox);
    content.appendChild(label);

    const counter = document.createElement("div");
    counter.className = "counter";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.className = "minus";
    minus.textContent = "−";

    const countSpan = document.createElement("span");
    countSpan.className = "count";
    countSpan.textContent = "0";

    const plus = document.createElement("button");
    plus.type = "button";
    plus.className = "plus";
    plus.textContent = "+";

    let count = 0;
    plus.addEventListener("click", () => {
      pushHistory();
      count += 1;
      countSpan.textContent = count;
    });
    minus.addEventListener("click", () => {
      if (count > 0) {
        pushHistory();
        count -= 1;
        countSpan.textContent = count;
      }
    });

    counter.appendChild(minus);
    counter.appendChild(countSpan);
    counter.appendChild(plus);

    item.appendChild(content);
    item.appendChild(counter);

    // Click behavior: support shift-click range, ctrl/cmd toggle, normal click focus
    item.addEventListener("click", (e) => {
      const list = getItems();
      const idx = list.indexOf(item);
      if (e.shiftKey) {
        if (selectionAnchor === null)
          selectionAnchor = focusIndex >= 0 ? focusIndex : idx;
        selectRange(selectionAnchor, idx);
        setFocus(idx);
      } else if (e.ctrlKey || e.metaKey) {
        toggleSelectIndex(idx);
        setFocus(idx);
      } else {
        clearSelection();
        selectionAnchor = idx;
        setFocus(idx);
      }
    });

    return item;
  }

  /* Public actions */
  function addTask() {
    const taskText = input.value.trim();
    if (taskText === "") return;
    pushHistory();
    const item = createTaskElement(taskText);
    taskList.appendChild(item);
    input.value = "";
    input.focus();
  }

  function sortList() {
    pushHistory();
    const list = getItems();
    const sorted = list.slice().sort((a, b) => {
      const ta = (
        a.querySelector(".task-content span") || a.querySelector("span")
      ).textContent.toLowerCase();
      const tb = (
        b.querySelector(".task-content span") || b.querySelector("span")
      ).textContent.toLowerCase();
      return ta.localeCompare(tb);
    });
    sorted.forEach((li) => taskList.appendChild(li));
    clearSelection();
    setFocus(-1);
  }

  /* Event bindings */
  addBtn.addEventListener("click", addTask);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd+Z -> undo
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (document.activeElement === input) return;
    const list = getItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next =
        focusIndex < 0 ? 0 : Math.min(list.length - 1, focusIndex + 1);
      if (e.shiftKey) {
        if (selectionAnchor === null)
          selectionAnchor = focusIndex >= 0 ? focusIndex : next;
        setFocus(next);
        selectRange(selectionAnchor, next);
      } else {
        selectionAnchor = null;
        setFocus(next);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        focusIndex < 0 ? list.length - 1 : Math.max(0, focusIndex - 1);
      if (e.shiftKey) {
        if (selectionAnchor === null)
          selectionAnchor = focusIndex >= 0 ? focusIndex : prev;
        setFocus(prev);
        selectRange(selectionAnchor, prev);
      } else {
        selectionAnchor = null;
        setFocus(prev);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (selectedIndices.size > 0) {
        pushHistory();
        Array.from(selectedIndices).forEach((i) => adjustCountForIndex(i, -1));
      } else if (focusIndex >= 0) {
        pushHistory();
        adjustCountForIndex(focusIndex, -1);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (selectedIndices.size > 0) {
        pushHistory();
        Array.from(selectedIndices).forEach((i) => adjustCountForIndex(i, +1));
      } else if (focusIndex >= 0) {
        pushHistory();
        adjustCountForIndex(focusIndex, +1);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndices.size > 0) {
        pushHistory();
        const list = getItems();
        Array.from(selectedIndices).forEach((i) => {
          const cb = list[i].querySelector("input[type='checkbox']");
          if (cb) cb.checked = !cb.checked;
          const label = list[i].querySelector("span");
          if (label)
            cb && cb.checked
              ? label.classList.add("completed")
              : label.classList.remove("completed");
        });
      } else if (focusIndex >= 0) {
        pushHistory();
        const li = list[focusIndex];
        const cb = li.querySelector("input[type='checkbox']");
        if (cb) {
          cb.checked = !cb.checked;
          const label = li.querySelector('span');
          if (label)
            cb.checked
              ? label.classList.add('completed')
              : label.classList.remove('completed');
        }
      }
    } else if (e.key === "Shift") {
      if (focusIndex >= 0) toggleSelectIndex(focusIndex);
    } else if (e.key.toLowerCase() === "s") {
      sortList();
    }
  });

  if (sortBtn) sortBtn.addEventListener("click", sortList);
  if (undoBtn) undoBtn.addEventListener("click", undo);

  deleteBtn.addEventListener("click", () => {
    pushHistory();
    const list = getItems();
    if (selectedIndices.size > 0) {
      Array.from(selectedIndices)
        .sort((a, b) => b - a)
        .forEach((i) => {
          const li = list[i];
          if (li) li.remove();
        });
      clearSelection();
      setFocus(-1);
    } else {
      const checked = document.querySelectorAll(
        "#taskList input[type='checkbox']:checked",
      );
      checked.forEach((cb) => {
        const li = cb.closest("li");
        if (li) li.remove();
      });
    }
  });

  restartBtn.addEventListener("click", () => {
    pushHistory();
    taskList.innerHTML = "";
    clearSelection();
    setFocus(-1);
  });

  // expose minimal API for testing if needed
  window.__todo = { addTask, sortList, undo };
})();
