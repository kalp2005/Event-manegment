document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION CHECK ---
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // --- DOM ELEMENT SELECTORS ---
    const views = document.querySelectorAll('main > section');
    const navLinks = document.querySelectorAll('.nav-link');
    const welcomeUserSpan = document.getElementById('welcomeUser');
    
    // Modals & Buttons
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    // Filter Elements
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const statusFilter = document.getElementById('statusFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    // Data Management Elements
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');


    // --- DATA STORAGE FUNCTIONS ---
    const getStaff = () => JSON.parse(localStorage.getItem(`staff_${loggedInUser}`)) || [];
    const saveStaff = (staff) => localStorage.setItem(`staff_${loggedInUser}`, JSON.stringify(staff));
    
    const getEvents = () => {
        const events = JSON.parse(localStorage.getItem(`events_${loggedInUser}`)) || [];
        events.forEach(event => {
            if (event.guests) {
                event.guests.forEach(guest => {
                    if (!guest.status) {
                        guest.status = 'Pending';
                    }
                });
            }
        });
        return events;
    };
    const saveEvents = (events) => localStorage.setItem(`events_${loggedInUser}`, JSON.stringify(events));

    // --- VIEW SWITCHING LOGIC ---
    const switchView = (viewId, eventId = null) => {
        views.forEach(view => view.classList.add('hidden'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.remove('hidden');
        
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewId);
        });

        if (viewId === 'staffView') displayStaff();
        if (viewId === 'dashboardView') {
            filterAndDisplayEvents();
            updateAnalytics();
        }
        if (viewId === 'calendarView') renderCalendar();
        if (viewId === 'detailsView' && eventId) {
            renderEventDetails(eventId);
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(link.dataset.view);
        });
    });

    // --- USER INFO & LOGOUT ---
    if (welcomeUserSpan) welcomeUserSpan.textContent = `Welcome, ${loggedInUser}!`;
    
    logoutBtn.addEventListener('click', () => logoutModal.classList.remove('hidden'));
    cancelLogoutBtn.addEventListener('click', () => logoutModal.classList.add('hidden'));
    confirmLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    });

    // --- STAFF MANAGEMENT ---
    const staffForm = document.getElementById('staff-form');
    const staffList = document.getElementById('staff-list');
    let staffToDeleteId = null;

    const displayStaff = () => {
        const allStaff = getStaff();
        staffList.innerHTML = '';
        if (allStaff.length === 0) {
            staffList.innerHTML = '<p class="placeholder-text">No staff members have been added yet.</p>';
            return;
        }
        allStaff.forEach(member => {
            const staffCard = document.createElement('div');
            staffCard.className = 'staff-card';
            staffCard.innerHTML = `
                <div class="staff-info">
                    <h4>${member.name}</h4>
                    <p>${member.role} | ${member.email}</p>
                </div>
                <button class="btn btn-danger delete-btn" data-type="staff" data-id="${member.id}"><i class="fas fa-trash"></i></button>
            `;
            staffList.appendChild(staffCard);
        });
    };

    if (staffForm) {
        staffForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newStaffMember = { id: Date.now(), name: document.getElementById('staffName').value, email: document.getElementById('staffEmail').value, role: document.getElementById('staffRole').value };
            const allStaff = getStaff();
            allStaff.push(newStaffMember);
            saveStaff(allStaff);
            displayStaff();
            staffForm.reset();
        });
    }

    // --- EVENT MANAGEMENT ---
    const showCreateFormBtn = document.getElementById('showCreateFormBtn');
    const cancelEventFormBtn = document.getElementById('cancelEventFormBtn');
    const eventForm = document.getElementById('event-form');
    const staffAssignDropdown = document.getElementById('staff-assign-dropdown');
    const dateTimeInputContainer = document.getElementById('dateTimeInputContainer');
    const eventDateTimeInput = document.getElementById('eventDateTime');
    let eventToDeleteId = null;

    let tempGuests = [];
    let tempAssignedStaff = [];
    
    if (dateTimeInputContainer) {
        dateTimeInputContainer.addEventListener('click', () => {
            try { eventDateTimeInput.showPicker(); } 
            catch (error) { console.error("Browser doesn't support showPicker()", error); }
        });
    }

    const populateStaffDropdown = () => {
        const allStaff = getStaff();
        staffAssignDropdown.innerHTML = '<option value="">Select Staff...</option>';
        allStaff.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = `${member.name} (${member.role})`;
            staffAssignDropdown.appendChild(option);
        });
    };

    const displayPreviewLists = () => {
        const guestPreview = document.getElementById('guest-list-preview');
        const staffPreview = document.getElementById('assigned-staff-preview');
        guestPreview.innerHTML = '<h4>Added Guests:</h4>';
        staffPreview.innerHTML = '<h4>Assigned Staff:</h4>';
        tempGuests.forEach(guest => { guestPreview.innerHTML += `<div class="preview-item">${guest.name} (${guest.email})</div>`; });
        tempAssignedStaff.forEach(staff => { staffPreview.innerHTML += `<div class="preview-item">${staff.name} - ${staff.task}</div>`; });
    };

    if (showCreateFormBtn) {
        showCreateFormBtn.addEventListener('click', () => {
            eventForm.reset();
            tempGuests = [];
            tempAssignedStaff = [];
            displayPreviewLists();
            populateStaffDropdown();
            document.getElementById('form-title').textContent = 'Create New Event';
            document.getElementById('eventId').value = '';
            switchView('formView');
        });
    }

    if (cancelEventFormBtn) cancelEventFormBtn.addEventListener('click', () => switchView('dashboardView'));

    document.getElementById('addGuestBtn').addEventListener('click', () => {
        const name = document.getElementById('guestName').value;
        const email = document.getElementById('guestEmail').value;
        if (name && email) {
            tempGuests.push({ name, email, mobile: document.getElementById('guestMobile').value, status: 'Pending' });
            displayPreviewLists();
            document.getElementById('guestName').value = '';
            document.getElementById('guestEmail').value = '';
            document.getElementById('guestMobile').value = '';
        } else { alert('Please provide at least a name and email for the guest.'); }
    });

    document.getElementById('assignStaffBtn').addEventListener('click', () => {
        const staffId = staffAssignDropdown.value;
        const task = document.getElementById('assignedTask').value;
        const selectedStaff = getStaff().find(s => s.id == staffId);
        if (staffId && task && selectedStaff) {
            tempAssignedStaff.push({ staffId, name: selectedStaff.name, task });
            displayPreviewLists();
            document.getElementById('assignedTask').value = '';
            staffAssignDropdown.value = '';
        } else { alert('Please select a staff member and assign a task.'); }
    });

    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const eventId = document.getElementById('eventId').value;
            const eventData = {
                id: eventId ? Number(eventId) : Date.now(),
                name: document.getElementById('eventName').value,
                dateTime: document.getElementById('eventDateTime').value,
                venue: document.getElementById('eventVenue').value,
                description: document.getElementById('eventDescription').value,
                guests: tempGuests,
                assignedStaff: tempAssignedStaff,
            };
            let events = getEvents();
            if (eventId) {
                const eventIndex = events.findIndex(event => event.id == eventId);
                events[eventIndex] = eventData;
            } else {
                events.push(eventData);
            }
            saveEvents(events);
            alert('Event saved successfully!');
            switchView('dashboardView');
        });
    }
    
    // --- FILTERING AND DISPLAYING EVENTS ---
    const displayEvents = (eventsToDisplay) => {
        const eventList = document.getElementById('event-list');
        eventList.innerHTML = '';
        if (eventsToDisplay.length === 0) {
            eventList.classList.add('hidden');
            document.getElementById('no-events-placeholder').classList.remove('hidden');
            return;
        }
        eventList.classList.remove('hidden');
        document.getElementById('no-events-placeholder').classList.add('hidden');
        eventsToDisplay.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <h3>${event.name}</h3>
                <p><i class="fas fa-calendar-day"></i> ${new Date(event.dateTime).toLocaleDateString()}</p>
                <p><i class="fas fa-clock"></i> ${new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                <div class="card-actions">
                    <button class="btn btn-secondary view-btn" data-id="${event.id}">Details</button>
                    <button class="btn edit-btn" data-id="${event.id}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-type="event" data-id="${event.id}">Delete</button>
                </div>
            `;
            eventList.appendChild(eventCard);
        });
    };

    const filterAndDisplayEvents = () => {
        let events = getEvents();
        const searchTerm = searchInput.value.toLowerCase();
        const dateValue = dateFilter.value;
        const statusValue = statusFilter.value;
        const now = new Date();
        if (searchTerm) { events = events.filter(e => e.name.toLowerCase().includes(searchTerm)); }
        if (dateValue) { events = events.filter(e => e.dateTime.startsWith(dateValue)); }
        if (statusValue === 'upcoming') { events = events.filter(e => new Date(e.dateTime) >= now); }
        else if (statusValue === 'past') { events = events.filter(e => new Date(e.dateTime) < now); }
        displayEvents(events);
    };

    searchInput.addEventListener('input', filterAndDisplayEvents);
    dateFilter.addEventListener('change', filterAndDisplayEvents);
    statusFilter.addEventListener('change', filterAndDisplayEvents);
    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        dateFilter.value = '';
        statusFilter.value = 'all';
        filterAndDisplayEvents();
    });

    // --- RENDER EVENT DETAILS (with RSVP) ---
    const renderEventDetails = (eventId) => {
        const event = getEvents().find(ev => ev.id == eventId);
        if (!event) { switchView('dashboardView'); return; }

        document.getElementById('details-event-name').textContent = event.name;
        const detailsContent = document.getElementById('details-content');
        
        const createGuestItem = (guest) => {
            const status = guest.status || 'Pending';
            return `
                <div class="list-item rsvp-item">
                    <span>${guest.name} (${guest.email})</span>
                    <div class="rsvp-status">
                        <span class="status-badge status-${status.toLowerCase()}">${status}</span>
                        <select class="rsvp-select" data-guest-email="${guest.email}">
                            <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Attending" ${status === 'Attending' ? 'selected' : ''}>Attending</option>
                            <option value="Maybe" ${status === 'Maybe' ? 'selected' : ''}>Maybe</option>
                            <option value="Declined" ${status === 'Declined' ? 'selected' : ''}>Declined</option>
                        </select>
                    </div>
                </div>
            `;
        };

        detailsContent.innerHTML = `
            <p><strong>Date & Time:</strong> ${new Date(event.dateTime).toLocaleString()}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Description:</strong> ${event.description || 'N/A'}</p>
            <hr>
            <h4>Guest List (${event.guests.length})</h4>
            <div class="list-container" id="details-guest-list">${event.guests.map(createGuestItem).join('') || '<p>No guests added.</p>'}</div>
            <h4>Assigned Staff (${event.assignedStaff.length})</h4>
            <div class="list-container">${event.assignedStaff.map(s => `<div class="list-item">${s.name} - <strong>Task:</strong> ${s.task}</div>`).join('') || '<p>No staff assigned.</p>'}</div>
        `;

        const rsvpSelects = detailsContent.querySelectorAll('.rsvp-select');
        rsvpSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                updateRsvpStatus(eventId, e.target.dataset.guestEmail, e.target.value);
            });
        });
    };

    const updateRsvpStatus = (eventId, guestEmail, newStatus) => {
        let events = getEvents();
        const eventIndex = events.findIndex(ev => ev.id == eventId);
        if (eventIndex > -1) {
            const guestIndex = events[eventIndex].guests.findIndex(g => g.email === guestEmail);
            if (guestIndex > -1) {
                events[eventIndex].guests[guestIndex].status = newStatus;
                saveEvents(events);
                renderEventDetails(eventId);
            }
        }
    };

    // --- UNIVERSAL DELETE & DETAILS LOGIC ---
    document.querySelector('main').addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('view-btn')) switchView('detailsView', target.dataset.id);
        if (target.classList.contains('edit-btn')) {
            const eventId = target.dataset.id;
            const eventToEdit = getEvents().find(event => event.id == eventId);
            if (eventToEdit) {
                document.getElementById('form-title').textContent = 'Edit Event';
                document.getElementById('eventId').value = eventToEdit.id;
                document.getElementById('eventName').value = eventToEdit.name;
                document.getElementById('eventDateTime').value = eventToEdit.dateTime;
                document.getElementById('eventVenue').value = eventToEdit.venue;
                document.getElementById('eventDescription').value = eventToEdit.description;
                tempGuests = eventToEdit.guests;
                tempAssignedStaff = eventToEdit.assignedStaff;
                populateStaffDropdown();
                displayPreviewLists();
                switchView('formView');
            }
        }
        const deleteButton = target.closest('.delete-btn');
        if (deleteButton) {
            const type = deleteButton.dataset.type;
            const id = deleteButton.dataset.id;
            document.getElementById('deleteModalTitle').textContent = `Confirm Deletion`;
            document.getElementById('deleteModalText').textContent = `Are you sure you want to delete this ${type}? This action cannot be undone.`;
            deleteModal.classList.remove('hidden');
            if (type === 'event') eventToDeleteId = id;
            if (type === 'staff') staffToDeleteId = id;
        }
    });
    
    confirmDeleteBtn.addEventListener('click', () => {
        if (eventToDeleteId) { let events = getEvents(); events = events.filter(event => event.id != eventToDeleteId); saveEvents(events); }
        if (staffToDeleteId) { let allStaff = getStaff(); allStaff = allStaff.filter(member => member.id != staffToDeleteId); saveEvents(allStaff); }
        deleteModal.classList.add('hidden');
        eventToDeleteId = null; staffToDeleteId = null;
        const currentView = document.querySelector('nav .nav-link.active').dataset.view;
        switchView(currentView);
    });

    cancelDeleteBtn.addEventListener('click', () => { deleteModal.classList.add('hidden'); eventToDeleteId = null; staffToDeleteId = null; });
    document.getElementById('backToDashboardBtn').addEventListener('click', () => switchView('dashboardView'));
    
    // --- UPDATED: ANALYTICS ---
    const updateAnalytics = () => {
        const events = getEvents();
        const staff = getStaff();
        const upcomingEvents = events.filter(e => new Date(e.dateTime) > new Date());
        
        // Find next event
        let nextEvent = null;
        if (upcomingEvents.length > 0) {
            nextEvent = upcomingEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];
        }

        // Calculate total attending guests
        const attendingGuests = upcomingEvents.reduce((acc, event) => {
            const attending = event.guests ? event.guests.filter(g => g.status === 'Attending').length : 0;
            return acc + attending;
        }, 0);

        // Calculate busiest month
        const monthCounts = {};
        events.forEach(event => {
            const month = new Date(event.dateTime).toLocaleString('default', { month: 'long', year: 'numeric' });
            monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        let busiestMonth = 'N/A';
        let maxEvents = 0;
        for (const month in monthCounts) {
            if (monthCounts[month] > maxEvents) {
                maxEvents = monthCounts[month];
                busiestMonth = month;
            }
        }

        const analyticsGrid = document.getElementById('analytics-grid');
        analyticsGrid.innerHTML = `
            <div class="summary-card"><i class="fas fa-calendar-check"></i><div class="card-content"><h3>Upcoming Events</h3><p>${upcomingEvents.length}</p></div></div>
            <div class="summary-card"><i class="fas fa-users"></i><div class="card-content"><h3>Total Staff</h3><p>${staff.length}</p></div></div>
            <div class="summary-card"><i class="fas fa-user-check"></i><div class="card-content"><h3>Guests Attending</h3><p>${attendingGuests}</p></div></div>
            <div class="summary-card"><i class="fas fa-chart-line"></i><div class="card-content"><h3>Busiest Month</h3><p>${busiestMonth}</p></div></div>
            <div class="summary-card wide"><i class="fas fa-star"></i><div class="card-content"><h3>Next Event</h3><p>${nextEvent ? `${nextEvent.name} on ${new Date(nextEvent.dateTime).toLocaleDateString()}` : 'None'}</p></div></div>
        `;
    };


    // --- CALENDAR LOGIC ---
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthYearDisplay = document.getElementById('monthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    let currentDate = new Date();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYearDisplay.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        calendarGrid.innerHTML = `
            <div class="day-name">Sun</div> <div class="day-name">Mon</div> <div class="day-name">Tue</div>
            <div class="day-name">Wed</div> <div class="day-name">Thu</div> <div class="day-name">Fri</div>
            <div class="day-name">Sat</div>
        `;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const events = getEvents();
        const eventDates = events.map(e => new Date(e.dateTime).toDateString());
        for (let i = 0; i < firstDayOfMonth; i++) { calendarGrid.insertAdjacentHTML('beforeend', '<div class="day"></div>'); }
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(year, month, i);
            let dayClasses = 'day current-month';
            if (dayDate.toDateString() === today.toDateString()) { dayClasses += ' today'; }
            let eventDot = '';
            if (eventDates.includes(dayDate.toDateString())) { eventDot = '<div class="event-dot"></div>'; }
            calendarGrid.insertAdjacentHTML('beforeend', `<div class="${dayClasses}"><div class="day-number">${i}</div>${eventDot}</div>`);
        }
    };
    
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    
    // --- DATA EXPORT/IMPORT LOGIC ---
    exportDataBtn.addEventListener('click', () => {
        const dataToExport = { staff: getStaff(), events: getEvents() };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event-manager-backup-${loggedInUser}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    importDataBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirm('Are you sure you want to import this data? This will overwrite all current events and staff for your user.')) {
                    if (importedData.staff) saveStaff(importedData.staff);
                    if (importedData.events) saveEvents(importedData.events);
                    alert('Data imported successfully!');
                    switchView('dashboardView');
                }
            } catch (err) {
                alert('Error: The selected file is not a valid JSON backup.');
                console.error('Import error:', err);
            }
        };
        reader.readAsText(file);
        importFileInput.value = '';
    });


    // --- INITIALIZATION ---
    switchView('dashboardView');
});

