const form = document.getElementById("studentForm");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");
const clearAllButton = document.getElementById("clearAllButton");
const recordsTableBody = document.getElementById("recordsTableBody");
const recordsContainer = document.getElementById("recordsContainer");
const emptyState = document.getElementById("emptyState");
const recordCount = document.getElementById("recordCount");

const fields = {
  studentName: document.getElementById("studentName"),
  studentId: document.getElementById("studentId"),
  studentClass: document.getElementById("studentClass"),
  studentEmail: document.getElementById("studentEmail"),
  studentContact: document.getElementById("studentContact"),
  studentAddress: document.getElementById("studentAddress")
};

const errors = {
  studentName: document.getElementById("studentNameError"),
  studentId: document.getElementById("studentIdError"),
  studentClass: document.getElementById("studentClassError"),
  studentEmail: document.getElementById("studentEmailError"),
  studentContact: document.getElementById("studentContactError"),
  studentAddress: document.getElementById("studentAddressError")
};

const STORAGE_KEY = "studentRegistrationRecords";
let students = loadStudents();
let editingIndex = null;

renderStudents();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const student = getFormData();
  if (!validateStudent(student)) {
    return;
  }

  if (editingIndex === null) {
    students.push(student);
  } else {
    students[editingIndex] = student;
  }

  saveStudents();
  resetForm();
  renderStudents();
});

cancelButton.addEventListener("click", resetForm);

clearAllButton.addEventListener("click", () => {
  if (!students.length) {
    return;
  }

  students = [];
  saveStudents();
  resetForm();
  renderStudents();
});

recordsTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  if (button.dataset.action === "edit") {
    startEdit(index);
  }

  if (button.dataset.action === "delete") {
    deleteStudent(index);
  }
});

fields.studentId.addEventListener("input", () => {
  fields.studentId.value = fields.studentId.value.replace(/\D/g, "");
});

fields.studentContact.addEventListener("input", () => {
  fields.studentContact.value = fields.studentContact.value.replace(/\D/g, "");
});

fields.studentName.addEventListener("input", () => {
  fields.studentName.value = fields.studentName.value.replace(/[^A-Za-z\s]/g, "");
});

function loadStudents() {
  const savedRecords = localStorage.getItem(STORAGE_KEY);
  return savedRecords ? JSON.parse(savedRecords) : [];
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function getFormData() {
  return {
    studentName: fields.studentName.value.trim(),
    studentId: fields.studentId.value.trim(),
    studentClass: fields.studentClass.value.trim(),
    studentEmail: fields.studentEmail.value.trim(),
    studentContact: fields.studentContact.value.trim(),
    studentAddress: fields.studentAddress.value.trim()
  };
}

function validateStudent(student) {
  clearErrors();

  let isValid = true;
  const namePattern = /^[A-Za-z\s]+$/;
  const numberPattern = /^\d+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const duplicateId = students.some((record, index) => {
    return record.studentId === student.studentId && index !== editingIndex;
  });

  // Validation is kept in one place so empty records and invalid formats are blocked before storage.
  if (!student.studentName || !namePattern.test(student.studentName)) {
    showError("studentName", "Enter a name using characters only.");
    isValid = false;
  }

  if (!student.studentId || !numberPattern.test(student.studentId)) {
    showError("studentId", "Student ID must contain numbers only.");
    isValid = false;
  } else if (duplicateId) {
    showError("studentId", "This student ID already exists.");
    isValid = false;
  }

  if (!student.studentClass) {
    showError("studentClass", "Enter the student's class.");
    isValid = false;
  }

  if (!student.studentEmail || !emailPattern.test(student.studentEmail)) {
    showError("studentEmail", "Enter a valid email address.");
    isValid = false;
  }

  if (!student.studentContact || !numberPattern.test(student.studentContact) || student.studentContact.length < 10) {
    showError("studentContact", "Contact number must have at least 10 digits.");
    isValid = false;
  }

  if (!student.studentAddress) {
    showError("studentAddress", "Enter the student's address.");
    isValid = false;
  }

  return isValid;
}

function showError(fieldName, message) {
  errors[fieldName].textContent = message;
}

function clearErrors() {
  Object.values(errors).forEach((error) => {
    error.textContent = "";
  });
}

function renderStudents() {
  recordsTableBody.innerHTML = "";

  students.forEach((student, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(student.studentName)}</td>
      <td>${escapeHtml(student.studentId)}</td>
      <td>${escapeHtml(student.studentClass)}</td>
      <td>${escapeHtml(student.studentEmail)}</td>
      <td>${escapeHtml(student.studentContact)}</td>
      <td>${escapeHtml(student.studentAddress)}</td>
      <td>
        <div class="action-group">
          <button type="button" data-action="edit" data-index="${index}">Edit</button>
          <button type="button" class="danger" data-action="delete" data-index="${index}">Delete</button>
        </div>
      </td>
    `;
    recordsTableBody.appendChild(row);
  });

  const hasRecords = students.length > 0;
  emptyState.classList.toggle("hidden", hasRecords);
  clearAllButton.classList.toggle("hidden", !hasRecords);
  recordCount.textContent = hasRecords
    ? `${students.length} ${students.length === 1 ? "record" : "records"} saved.`
    : "No records yet.";

  updateScrollbar();
}

function updateScrollbar() {
  recordsContainer.classList.toggle("scrollable", students.length > 5);
}

function startEdit(index) {
  const student = students[index];
  editingIndex = index;

  Object.keys(fields).forEach((fieldName) => {
    fields[fieldName].value = student[fieldName];
  });

  submitButton.textContent = "Update Student";
  cancelButton.classList.remove("hidden");
  fields.studentName.focus();
}

function deleteStudent(index) {
  students.splice(index, 1);
  saveStudents();

  if (editingIndex === index) {
    resetForm();
  } else if (editingIndex !== null && index < editingIndex) {
    editingIndex -= 1;
  }

  renderStudents();
}

function resetForm() {
  form.reset();
  editingIndex = null;
  submitButton.textContent = "Add Student";
  cancelButton.classList.add("hidden");
  clearErrors();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}