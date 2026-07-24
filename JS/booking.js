// ============================================================
// AUDIOMIND — appointment booking
// Slots are blocked using the browser's localStorage under the
// key "audiomind_bookings". This keeps already-picked slots from
// being picked again ON THE SAME DEVICE/BROWSER. It does NOT sync
// bookings across different visitors' devices or to the clinic's
// staff automatically — for that, the form's final submit should
// be wired to email/WhatsApp/a real backend (see note in the page).
// ============================================================

const STORE_KEY = 'audiomind_bookings';
const SLOT_TIMES = ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedSlot = null;

function loadBookings() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveBooking(branch, dateKey, time, name) {
  const data = loadBookings();
  const k = `${branch}|${dateKey}`;
  if (!data[k]) data[k] = [];
  data[k].push({ time, name });
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}
function takenSlots(branch, dateKey) {
  const data = loadBookings();
  const k = `${branch}|${dateKey}`;
  return (data[k] || []).map(b => b.time);
}

function pad(n) { return n < 10 ? '0' + n : n; }
function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function renderCalendar() {
  const grid = document.getElementById('calGrid');
  const label = document.getElementById('calLabel');
  if (!grid) return;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  label.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let html = '';
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => html += `<div class="dow">${d}</div>`);
  for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(currentYear, currentMonth, d);
    const isPast = thisDate < today;
    const isSunday = thisDate.getDay() === 0;
    const k = dateKey(currentYear, currentMonth, d);
    const classes = ['day'];
    if (isPast) classes.push('past');
    if (isSunday) classes.push('sunday');
    if (selectedDate === k) classes.push('selected');
    html += `<div class="${classes.join(' ')}" data-date="${k}" data-sunday="${isSunday}" data-past="${isPast}">${d}</div>`;
  }
  grid.innerHTML = html;

  grid.querySelectorAll('.day:not(.empty):not(.past)').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.sunday === 'true') {
        alert('Clinic is closed on Sundays. Please choose Monday–Saturday.');
        return;
      }
      selectedDate = el.dataset.date;
      selectedSlot = null;
      renderCalendar();
      renderSlots();
    });
  });
}

function renderSlots() {
  const box = document.getElementById('slotsBox');
  const grid = document.getElementById('slotGrid');
  if (!box || !grid) return;
  if (!selectedDate) { box.style.display = 'none'; return; }
  box.style.display = 'block';

  const branch = document.getElementById('branchSelect').value;
  const taken = takenSlots(branch, selectedDate);

  grid.innerHTML = SLOT_TIMES.map(t => {
    const isTaken = taken.includes(t);
    const isSel = selectedSlot === t;
    return `<div class="slot ${isTaken ? 'taken' : ''} ${isSel ? 'selected' : ''}" data-time="${t}">${t}</div>`;
  }).join('');

  grid.querySelectorAll('.slot:not(.taken)').forEach(el => {
    el.addEventListener('click', () => {
      selectedSlot = el.dataset.time;
      renderSlots();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('calGrid')) return;

  renderCalendar();

  document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar(); renderSlots();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar(); renderSlots();
  });
  document.getElementById('branchSelect').addEventListener('change', () => {
    selectedSlot = null;
    renderSlots();
  });

  document.getElementById('bookingForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('patientName').value.trim();
    const phone = document.getElementById('patientPhone').value.trim();
    const branch = document.getElementById('branchSelect').value;
    const service = document.getElementById('serviceSelect').value;

    if (!name || !phone) { alert('Please enter your name and phone number.'); return; }
    if (!selectedDate) { alert('Please select a date from the calendar.'); return; }
    if (!selectedSlot) { alert('Please select a time slot.'); return; }

    saveBooking(branch, selectedDate, selectedSlot, name);

    const confirmBox = document.getElementById('confirmBox');
    document.getElementById('confirmDetails').innerHTML =
      `<strong>${name}</strong>, your appointment request is noted for <strong>${selectedDate}</strong> at <strong>${selectedSlot}</strong>
       (${branch}) for <strong>${service}</strong>. Our team will call ${phone} shortly to confirm.`;
    confirmBox.classList.add('show');
    confirmBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    selectedSlot = null;
    renderSlots();
    e.target.reset();
  });
});
