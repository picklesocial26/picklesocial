// app.js — extracted from index.html
// Global variables
let selectedSlots = new Set();
let supabaseClient = null;

document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://nozisfmqzkeywefrqkok.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vemlzZm1xemtleXdlZnJxa29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzY2NzcsImV4cCI6MjA5NDE1MjY3N30.9CyqA4zZ9o5glyVl40Baah9ce-mqPIB3fAi2wp2-Ppk";

  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const dot = document.getElementById("statusDot");
  const label = document.getElementById("statusLabel");

  try {
    const { error } = await supabaseClient.from("bookings").select("id").limit(1);
    if (error) throw error;
    
    dot.style.background = "#4ade80";
    dot.style.boxShadow = "0 0 10px #4ade80";
    label.textContent = "Connected";
    label.style.color = "#4ade80";
  } catch (err) {
    console.error(err);
    dot.style.background = "#f87171";
    label.textContent = "Offline Mode";
    label.style.color = "#f87171";
  }

  // Booked slots cache for the current selectedDate
  let bookedSlots = new Set();

  // Load booked slots from Supabase for a specific dateKey (YYYY-MM-DD)
  async function loadBookedSlotsForDate(dk) {
    bookedSlots.clear();
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from('bookings')
        .select('time_slot,court')
        .eq('booking_date', dk);
      if (error) throw error;
      if (data && Array.isArray(data)) {
        data.forEach(row => {
          const courtIndex = COURTS.indexOf(row.court);
          if (courtIndex >= 0 && row.time_slot) {
            bookedSlots.add(`${dk}|${row.time_slot}|${courtIndex}`);
          }
        });
      }
    } catch (e) {
      console.error('loadBookedSlotsForDate error', e);
      // Don't block UI; show a subtle toast if connection failed
      showToast('Could not load bookings (offline)');
    }
  }

  // Helper to load bookings then render table
  async function loadAndRenderTable() {
    const dk = dateKey(selectedDate);
    await loadBookedSlotsForDate(dk);
    renderTable();
  }

  // 24-HOUR SLOTS
  const SLOTS = [
    '12:00 AM - 1:00 AM',
    '1:00 AM - 2:00 AM',
    '2:00 AM - 3:00 AM',
    '3:00 AM - 4:00 AM',
    '4:00 AM - 5:00 AM',
    '5:00 AM - 6:00 AM',
    '6:00 AM - 7:00 AM',
    '7:00 AM - 8:00 AM',
    '8:00 AM - 9:00 AM',
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM',
    '7:00 PM - 8:00 PM',
    '8:00 PM - 9:00 PM',
    '9:00 PM - 10:00 PM',
    '10:00 PM - 11:00 PM',
    '11:00 PM - 12:00 AM'
  ];

  const COURTS = ['Court One', 'Court Two'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let selectedDate = new Date();
  let today = new Date();
  let viewMonth = today.getMonth();
  let viewYear = today.getFullYear();

  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDateDisplay(d) {
    return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // Day rate: 6AM-6PM (slots starting 6AM through 5PM)
  // Night rate: 6PM-6AM (slots starting 6PM through 5AM)
  function getRate(slot) {
    const daySlots = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];
    return daySlots.some(t => slot.startsWith(t)) ? 450 : 500;
  }

  function renderCalendar() {
    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';
    document.getElementById('calMonthYear').textContent = `${MONTHS[viewMonth]} ${viewYear}`;

    DAYS.forEach(day => {
      const el = document.createElement('div');
      el.className = 'cal-dow';
      el.textContent = day;
      grid.appendChild(el);
    });

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }

    for (let d = 1; d <= totalDays; d++) {
      const day = document.createElement('div');
      day.className = 'cal-day';
      day.textContent = d;

      const thisDate = new Date(viewYear, viewMonth, d);
      const isToday = d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
      const isSelected = d === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
      const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (isToday) day.classList.add('today');
      if (isSelected && !isToday) day.classList.add('selected');
      if (isPast) day.classList.add('past');

      if (!isPast) {
        day.onclick = () => {
          selectedDate = new Date(viewYear, viewMonth, d);
          renderCalendar();
          loadAndRenderTable();
        };
      }

      grid.appendChild(day);
    }
  }

  document.getElementById('prevBtn').onclick = () => {
    viewMonth--;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear--;
    }
    renderCalendar();
    loadAndRenderTable();
  };

  document.getElementById('nextBtn').onclick = () => {
    viewMonth++;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear++;
    }
    renderCalendar();
    loadAndRenderTable();
  };

  window.goToToday = function() {
    selectedDate = new Date(today);
    viewMonth = today.getMonth();
    viewYear = today.getFullYear();
    renderCalendar();
    loadAndRenderTable();
  };

  function renderTable() {
    const dk = dateKey(selectedDate);
    document.getElementById('selectedDateLabel').textContent = formatDateDisplay(selectedDate);

    const body = document.getElementById('slotBody');
    body.innerHTML = '';

    SLOTS.forEach(slot => {
      const tr = document.createElement('tr');
      
      const tdTime = document.createElement('td');
      tdTime.className = 'time-cell';
      tdTime.textContent = slot;
      tr.appendChild(tdTime);

      COURTS.forEach((court, index) => {
        const tdC = document.createElement('td');
        const key = `${dk}|${slot}|${index}`;
        const btn = document.createElement('button');
        btn.className = 'slot-btn';

        // If the slot is booked in Supabase, mark as booked and disable
        if (bookedSlots.has(key)) {
          btn.classList.add('slot-booked');
          btn.textContent = 'Booked';
          btn.disabled = true;
        } else if (selectedSlots.has(key)) {
          btn.classList.add('slot-selected');
          btn.textContent = '✓ Selected';
        } else {
          btn.classList.add('slot-available');
          btn.textContent = 'Available';
        }

        btn.onclick = () => {
          // Prevent selecting a slot that just became booked
          if (btn.disabled) return;
          if (selectedSlots.has(key)) {
            selectedSlots.delete(key);
          } else {
            selectedSlots.add(key);
          }
          updateCart();
          renderTable();
        };

        tdC.appendChild(btn);
        tr.appendChild(tdC);
      });

      body.appendChild(tr);
    });
  }

  function updateCart() {
    const count = selectedSlots.size;
    const total = [...selectedSlots].reduce((sum, key) => {
      return sum + getRate(key.split('|')[1]);
    }, 0);

    document.getElementById('cartCount').textContent = `${count} slot${count !== 1 ? 's' : ''} selected`;
    document.getElementById('cartTotal').textContent = `₱${total.toLocaleString()}`;
    document.getElementById('cartBar').classList.toggle('visible', count > 0);
  }

  window.clearForm = function() {
    selectedSlots.clear();
    updateCart();
    loadAndRenderTable();
    closeModal();
    closeSuccessModal();
    const refInput = document.getElementById('searchRef');
    if (refInput) refInput.value = '';
    showToast("🧹 Selection cleared!");
  };

  window.openModal = function() {
    // Open the reference search modal (no selection required)
    const refInput = document.getElementById('searchRef');
    if (refInput) refInput.value = '';
    document.getElementById('bookingModal').classList.add('open');
    setTimeout(() => { const el = document.getElementById('searchRef'); if (el) el.focus(); }, 120);
    updateCheckButtonState();
  };

  // Open the confirm modal which summarizes selected slots and collects name/phone
  window.openConfirmModal = function() {
    const container = document.getElementById('confirmSlotsContainer');
    const dateEl = document.getElementById('confirmDate');
    const countEl = document.getElementById('confirmCount');
    const totalEl = document.getElementById('confirmTotal');
    const nameEl = document.getElementById('confirmName');
    const phoneEl = document.getElementById('confirmPhone');
    const confirmBtn = document.getElementById('confirmModalBtn');

    if (!container || !dateEl || !countEl || !totalEl) return openModal();

    // Populate date
    dateEl.textContent = formatDateDisplay(selectedDate);

    // Build selected slots list
    container.innerHTML = '';
    const sel = [...selectedSlots];
    let total = 0;
    sel.forEach(key => {
      const parts = key.split('|');
      const date = parts[0];
      const slot = parts[1];
      const courtIndex = parseInt(parts[2], 10);
      const court = COURTS[courtIndex] || 'Court';
      const price = getRate(slot);
      total += price;

      const card = document.createElement('div');
      card.style.background = 'rgba(255,255,255,0.02)';
      card.style.padding = '12px';
      card.style.borderRadius = '8px';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';

      const left = document.createElement('div');
      left.innerHTML = `<div style="font-weight:700;color:#e5e7eb;">${court}</div><div style="color:#9ca3af;font-size:0.9rem;">${slot}</div>`;
      const right = document.createElement('div');
      right.style.color = 'var(--accent)';
      right.style.fontWeight = '800';
      right.textContent = `₱${price}`;

      card.appendChild(left);
      card.appendChild(right);
      container.appendChild(card);
    });

    countEl.textContent = sel.length;
    totalEl.textContent = `₱${total}`;

    // Prefill name/phone from booking modal fields if available
    const existingName = document.getElementById('bookingName');
    const existingPhone = document.getElementById('bookingPhone');
    if (nameEl) nameEl.value = existingName ? existingName.value : '';
    if (phoneEl) phoneEl.value = existingPhone ? existingPhone.value : '';

    // open modal
    document.getElementById('confirmModal').classList.add('open');
    setTimeout(() => { if (nameEl) nameEl.focus(); }, 120);

    // Wire input events for validation
    function updateConfirmModalButtonState() {
      const name = (document.getElementById('confirmName') || {}).value || '';
      const phone = (document.getElementById('confirmPhone') || {}).value || '';
      if (!confirmBtn) return;
      confirmBtn.disabled = !(name.trim() && phone.trim());
    }

    if (nameEl) nameEl.addEventListener('input', updateConfirmModalButtonState);
    if (phoneEl) phoneEl.addEventListener('input', updateConfirmModalButtonState);
    updateConfirmModalButtonState();
  };

  window.closeConfirmModal = function() { document.getElementById('confirmModal').classList.remove('open'); };

  window.removeSlot = function(key) {
    selectedSlots.delete(key);
    updateCart();
    loadAndRenderTable();
    
    if (selectedSlots.size === 0) {
      closeModal();
      showToast('All slots removed');
    } else {
      openModal(); // Re-render modal
    }
  };

  window.closeModal = function() {
    document.getElementById('bookingModal').classList.remove('open');
  };

  window.closeSuccessModal = function() {
    document.getElementById('successModal').classList.remove('open');
  };

  window.submitBooking = async function() {
    // Read values from either the detailed booking modal or the compact confirm modal
    // Prefer values from the confirm modal when present (user-filled there)
    const nameField = document.getElementById('confirmName') || document.getElementById('bookingName');
    const emailField = document.getElementById('bookingEmail');
    const phoneField = document.getElementById('confirmPhone') || document.getElementById('bookingPhone');
    const notesField = document.getElementById('bookingNotes');

    const name = nameField ? nameField.value.trim() : '';
    const email = emailField ? emailField.value.trim() : '';
    const phone = phoneField ? phoneField.value.trim() : '';
    const notes = notesField ? notesField.value.trim() : '';

    // Require name and phone; email is optional in the compact confirm modal
    if (!name || !phone) {
      showToast('⚠️ Please fill in your name and phone');
      return;
    }

    if (email && !email.includes('@')) {
      showToast('⚠️ Please enter a valid email');
      return;
    }

    const confirmBtn = document.getElementById('confirmBtn') || document.getElementById('confirmModalBtn');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Processing...';
    }

    try {
      // Generate booking reference
      const refCode = 'PKL-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

      // Prepare booking data
      const bookings = [...selectedSlots].map(key => {
        const [date, slot, courtIndex] = key.split('|');
        const payload = {
          reference_code: refCode,
          customer_name: name,
          phone_number: '+63' + phone.replace(/\D/g, ''),
          booking_date: date,
          booking_time: slot,
          time_slot: slot,
          court_name: COURTS[parseInt(courtIndex)],
          court: COURTS[parseInt(courtIndex)],
          price: getRate(slot),
          rate: getRate(slot),
          status: 'pending'
        };
        if (email) payload.customer_email = email;
        if (notes) payload.notes = notes;
        return payload;
      });

      // Insert to Supabase (if connected)
      let insertError = null;
      if (supabaseClient) {
        const { error } = await supabaseClient.from('bookings').insert(bookings);
        if (error) insertError = error;
      }

      if (insertError) {
        console.error('Insert error', insertError);
        console.error('Insert error details:', insertError.message, insertError.details, insertError.hint, insertError.code);
        showToast('❌ Booking failed to save. Try again.');
      } else {
        // compute total
        const totalAmount = bookings.reduce((s, b) => s + (b.price || 0), 0);

        // Clear selections and update UI
        selectedSlots.clear();
        updateCart();
        // reload bookings so newly booked slots are shown as booked
        await loadAndRenderTable();

        // Clear form inputs
        const nameEl = document.getElementById('bookingName'); if (nameEl) nameEl.value = '';
        const emailEl = document.getElementById('bookingEmail'); if (emailEl) emailEl.value = '';
        const phoneEl = document.getElementById('bookingPhone'); if (phoneEl) phoneEl.value = '';
        const notesEl = document.getElementById('bookingNotes'); if (notesEl) notesEl.value = '';

        // Close booking/confirm modal
        closeModal();
        closeConfirmModal();

        // Show success modal with booking ref
        document.getElementById('bookingRefCode').textContent = refCode;
        document.getElementById('successTitle').textContent = 'Booking Saved — Payment Pending';
        document.getElementById('successMessage').textContent = `Reference ${refCode} created. Processing payment...`;
        document.getElementById('successModal').classList.add('open');

        // Process payment (mock using your publishable key)
        await processPayment(refCode, totalAmount);
      }

    } catch (err) {
      console.error('Booking error:', err);
      showToast('❌ Booking failed. Please try again.');
    } finally {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirm Booking';
        }
    }
  };

  function updateConfirmButtonState() {
    const confirmBtn = document.getElementById('confirmBtn');
    const nameEl = document.getElementById('bookingName');
    const emailEl = document.getElementById('bookingEmail');
    const phoneEl = document.getElementById('bookingPhone');
    if (!confirmBtn || !nameEl || !emailEl || !phoneEl) return;
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const phone = phoneEl.value.trim();
    const validEmail = email.includes('@') && email.indexOf('@') !== 0 && email.indexOf('@') !== email.length - 1;
    confirmBtn.disabled = !(name && validEmail && phone);
  }

  // new: enable/disable the 'Check Status' button based on input
  function updateCheckButtonState() {
    const btn = document.getElementById('checkRefBtn');
    const ref = document.getElementById('searchRef');
    if (!btn) return;
    btn.disabled = !ref || !ref.value.trim();
  }

  const searchInputEl = document.getElementById('searchRef');
  if (searchInputEl) {
    searchInputEl.addEventListener('input', updateCheckButtonState);
    searchInputEl.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const btn = document.getElementById('checkRefBtn');
        if (btn && !btn.disabled) checkReference();
      }
    });
  }

    // Wire booking form inputs to enable/disable the Confirm button
    const bookingNameEl = document.getElementById('bookingName');
    const bookingEmailEl = document.getElementById('bookingEmail');
    const bookingPhoneEl = document.getElementById('bookingPhone');
    const bookingNotesEl = document.getElementById('bookingNotes');
    const confirmBtnEl = document.getElementById('confirmBtn');

    function attachBookingInputListeners() {
      const inputs = [bookingNameEl, bookingEmailEl, bookingPhoneEl];
      inputs.forEach(inp => {
        if (!inp) return;
        inp.addEventListener('input', updateConfirmButtonState);
      });
      updateConfirmButtonState();
    }

    attachBookingInputListeners();

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Search-by-reference handler
  window.checkReference = async function() {
    const refEl = document.getElementById('searchRef');
    const btn = document.getElementById('checkRefBtn');
    if (!refEl) return;
    const ref = refEl.value.trim();
    if (!ref) {
      showToast('⚠️ Please enter a reference number');
      return;
    }

    if (btn) {
      btn.disabled = true;
      var prevText = btn.textContent;
      btn.textContent = 'Checking...';
    }

    try {
      if (!supabaseClient) {
        showToast('Offline — cannot check bookings');
        return;
      }

      const { data, error } = await supabaseClient.from('bookings').select('*').eq('reference_code', ref);
      if (error) throw error;

      if (!data || data.length === 0) {
        showToast('🔎 Reference not found');
        return;
      }

      // Build results HTML
      const resultsEl = document.getElementById('searchResults');
      let html = '<div style="display:flex;flex-direction:column;gap:10px;">';
      data.forEach(row => {
        html += `
          <div style="background:#0f1720;border:1px solid #222;padding:10px;border-radius:8px;">
            <div style="font-weight:700;color:white;">${row.court} • ₱${row.price}</div>
            <div style="color:#9ca3af;font-size:0.9rem;">${row.booking_date} • ${row.time_slot}</div>
            <div style="color:#9ca3af;font-size:0.85rem;margin-top:6px;">Status: <strong style="color:var(--pink-400);">${row.status}</strong></div>
          </div>
        `;
      });
      html += '</div>';

      if (resultsEl) resultsEl.innerHTML = html;
      document.getElementById('bookingRefCode').textContent = ref;
      document.getElementById('successTitle').textContent = 'Booking Found';
      document.getElementById('successMessage').textContent = `Found ${data.length} record${data.length>1?'s':''}.`;
      closeModal();
      document.getElementById('successModal').classList.add('open');

    } catch (err) {
      console.error('Search error:', err);
      showToast('❌ Error checking reference');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = prevText || 'Check Status';
      }
    }
  };

  // ----- Real Payrex payment handling via backend endpoint
  // Use relative path so the frontend works when served from the same backend.
  const PAYMENT_SERVER_URL = '';

  async function processPayment(referenceCode, amount) {
    try {
      showToast('Processing payment...');

      const response = await fetch(`https://picklesocial.vercel.app/api/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference_code: referenceCode,
          amount,
          currency: 'PHP',
          description: `Pickle Social booking ${referenceCode}`
        })
      });

      let data = null;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.warn('Failed to parse payment response JSON', jsonErr);
      }
      if (!response.ok) {
        throw new Error(data?.error || `Payment creation failed (${response.status})`);
      }

      const paymentId = data.id || data.payment_id || data.transaction_id || `pay_${Date.now().toString(36).toUpperCase()}`;
      const paymentStatus = (data.status || 'succeeded').toLowerCase();

      if (paymentStatus !== 'succeeded' && paymentStatus !== 'paid') {
        throw new Error(`Payment not completed: ${data.status || 'unknown'}`);
      }

      if (supabaseClient) {
        try {
          const { error: updErr } = await supabaseClient.from('bookings').update({ status: 'paid', payment_id: paymentId }).eq('reference_code', referenceCode);
          if (updErr) console.error('Booking update error', updErr);
        } catch (e2) {
          console.error('Booking update exception', e2);
        }
      }

      const pd = document.getElementById('paymentDetails');
      if (pd) {
        pd.innerHTML = `
          <div style="background:#071017;border:1px solid rgba(236,72,153,0.12);padding:10px;border-radius:8px;">
            <div style="font-weight:700;color:var(--accent);">Payment ${paymentStatus.toUpperCase()}</div>
            <div style="color:#9ca3af;font-size:0.9rem;">Amount: ₱${amount.toLocaleString()}</div>
            <div style="color:#9ca3af;font-size:0.9rem;">Payment ID: <strong>${paymentId}</strong></div>
          </div>
        `;
      }

      document.getElementById('successTitle').textContent = 'Payment Succeeded';
      document.getElementById('successMessage').textContent = `Your booking (${referenceCode}) is paid.`;
      showToast('✅ Payment succeeded');
      return data;
    } catch (err) {
      console.error('processPayment error', err);
      const pd = document.getElementById('paymentDetails');
      if (pd) {
        pd.innerHTML = `
          <div style="background:#4b1124;border:1px solid rgba(248,113,113,0.2);padding:10px;border-radius:8px;">
            <div style="font-weight:700;color:#fb7185;">Payment Failed</div>
            <div style="color:#fda4af;font-size:0.9rem;">${err.message}</div>
          </div>
        `;
      }
      showToast('❌ Payment failed');
      document.getElementById('successTitle').textContent = 'Payment Failed';
      document.getElementById('successMessage').textContent = `Payment could not be completed for ${referenceCode}.`;
      throw err;
    }
  }

  // Close modal on overlay click
  document.getElementById('bookingModal').onclick = function(e) {
    if (e.target === this) closeModal();
  };
  document.getElementById('successModal').onclick = function(e) {
    if (e.target === this) closeSuccessModal();
  };

  // Initialize
  renderCalendar();
  loadAndRenderTable();
});
