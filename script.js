const input = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const deleteBtn = document.getElementById("deleteBtn");
const restartBtn = document.getElementById("restartBtn");

function addTask() {
  const taskText = input.value.trim();

  if (taskText === "") return;

  const item = document.createElement("li");

  // Left side: checkbox + label
  const content = document.createElement("div");
  content.className = "task-content";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const label = document.createElement("span");
  label.textContent = taskText;

  // Toggle completed style when checkbox changes
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) label.classList.add("completed");
    else label.classList.remove("completed");
  });

  content.appendChild(checkbox);
  content.appendChild(label);

  // Right side: counter with - and + buttons
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
    count += 1;
    countSpan.textContent = count;
  });

  minus.addEventListener("click", () => {
    if (count > 0) {
      count -= 1;
      countSpan.textContent = count;
    }
  });

  counter.appendChild(minus);
  counter.appendChild(countSpan);
  counter.appendChild(plus);

  item.appendChild(content);
  item.appendChild(counter);
  taskList.appendChild(item);

  input.value = "";
  input.focus();
}

addBtn.addEventListener("click", addTask);

// Allow Enter key to add task
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

deleteBtn.addEventListener("click", () => {
  const checkedItems = document.querySelectorAll("#taskList input[type='checkbox']:checked");

  checkedItems.forEach((checkbox) => {
    const li = checkbox.closest("li");
    if (li) li.remove();
  });
});

restartBtn.addEventListener("click", () => {
  taskList.innerHTML = "";
});
