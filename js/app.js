document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // --- Core Data Functions ---
    const getEvents = () => {
        const events = localStorage.getItem(`events_${loggedInUser}`);
        return events ? JSON.parse(events) : [];
    };

    const saveEvents = (events) => {
        localStorage.setItem(`events_${loggedInUser}`, JSON.stringify(events));
    };

    // --- UI Functions ---
    const showToast = (message) => {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    };

    // --- Page Detection ---
    const path = window.location.pathname;

    // --- Logic for the Main Dashboard (index.html) ---
    if (path.includes('index.html')) {
        const eventList = document.getElementById('event-list');
        const welcomeUserSpan = document.getElementById('welcomeUser');
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
        const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
        const deleteModal = document.getElementById('deleteModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        
        let eventToDeleteId = null;

        if(welcomeUserSpan) welcomeUserSpan.textContent = `Welcome, ${loggedInUser}!`;

        const displayEvents = () => {
            const events = getEvents();
            eventList.innerHTML = ''; 
            if (events.length === 0) {
                eventList.innerHTML = '<p class="no-events-placeholder">No events found. Create one!</p>';
                return;
            }
            events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                    <h3>${event.name}</h3>
                    <div class="event-details">
                        <p><strong>Date:</strong> ${new Date(event.dateTime).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p><strong>Venue:</strong> ${event.venue}</p>
                    </div>
                    <div class="card-actions">
                        <a href="details.html?id=${event.id}" class="btn">View Details</a>
                        <a href="create.html?edit=true&id=${event.id}" class="btn btn-secondary">Edit</a>
                        <button class="btn btn-danger delete-btn" data-id="${event.id}">Delete</button>
                    </div>
                `;
                eventList.appendChild(eventCard);
            });
        };

        eventList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                eventToDeleteId = e.target.getAttribute('data-id');
                deleteModal.classList.remove('hidden');
            }
        });

        confirmDeleteBtn.addEventListener('click', () => {
            if (eventToDeleteId) {
                let events = getEvents();
                events = events.filter(event => event.id != eventToDeleteId);
                saveEvents(events);
                displayEvents();
                showToast('Event deleted successfully.');
            }
            deleteModal.classList.add('hidden');
            eventToDeleteId = null;
        });
        
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.add('hidden');
            eventToDeleteId = null;
        });

        logoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
        });
        
        confirmLogoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        });

        cancelLogoutBtn.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
        });

        const toastMessage = sessionStorage.getItem('toastMessage');
        if (toastMessage) {
            showToast(toastMessage);
            sessionStorage.removeItem('toastMessage');
        }

        displayEvents();
    }

    // --- Logic for the Create/Edit Page (create.html) ---
    if (path.includes('create.html')) {
        const eventForm = document.getElementById('event-form');
        const formTitle = document.getElementById('form-title');
        const eventIdField = document.getElementById('eventId');
        const eventDateTimeInput = document.getElementById('eventDateTime');
        const eventDateTimeLabel = document.getElementById('eventDateTimeLabel');

        if(eventDateTimeLabel && eventDateTimeInput) {
            eventDateTimeLabel.addEventListener('click', () => {
                try {
                    eventDateTimeInput.showPicker();
                } catch (error) {
                    console.error("Browser doesn't support showPicker()", error);
                }
            });
        }

        const urlParams = new URLSearchParams(window.location.search);
        const isEditMode = urlParams.get('edit') === 'true';
        const eventId = urlParams.get('id');

        if (isEditMode && eventId) {
            formTitle.textContent = 'Edit Event';
            const events = getEvents();
            const eventToEdit = events.find(event => event.id == eventId);
            if (eventToEdit) {
                eventIdField.value = eventToEdit.id;
                document.getElementById('eventName').value = eventToEdit.name;
                document.getElementById('eventDateTime').value = eventToEdit.dateTime;
                document.getElementById('eventVenue').value = eventToEdit.venue;
                document.getElementById('eventDescription').value = eventToEdit.description;
                document.getElementById('eventGuests').value = eventToEdit.guests ? eventToEdit.guests.join(', ') : '';
                document.getElementById('eventStaff').value = eventToEdit.staff ? eventToEdit.staff.join(', ') : '';
            }
        }

        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const guestsValue = document.getElementById('eventGuests').value;
            const staffValue = document.getElementById('eventStaff').value;
            
            const guests = guestsValue ? guestsValue.split(',').map(email => email.trim()).filter(email => email) : [];
            const staff = staffValue ? staffValue.split(',').map(email => email.trim()).filter(email => email) : [];

            const eventData = {
                id: eventIdField.value ? Number(eventIdField.value) : Date.now(),
                name: document.getElementById('eventName').value,
                dateTime: document.getElementById('eventDateTime').value,
                venue: document.getElementById('eventVenue').value,
                description: document.getElementById('eventDescription').value,
                guests: guests,
                staff: staff
            };

            let events = getEvents();
            if (isEditMode) {
                const eventIndex = events.findIndex(event => event.id == eventData.id);
                events[eventIndex] = eventData;
                sessionStorage.setItem('toastMessage', 'Event updated successfully!');
            } else {
                events.push(eventData);
                sessionStorage.setItem('toastMessage', 'Event created successfully!');
            }

            saveEvents(events);
            window.location.href = 'index.html';
        });
    }

    // --- NEW: Logic for the Event Details Page (details.html) ---
    if (path.includes('details.html')) {
        const eventNameHeader = document.getElementById('event-name-header');
        const detailsContent = document.getElementById('event-details-content');

        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        const events = getEvents();
        const event = events.find(e => e.id == eventId);

        if (event) {
            eventNameHeader.textContent = event.name;
            detailsContent.innerHTML = `
                <h2>${event.name}</h2>
                <div class="detail-item">
                    <p><strong><i class="fas fa-calendar-alt"></i> Date & Time:</strong></p>
                    <p>${new Date(event.dateTime).toLocaleString()}</p>
                </div>
                <div class="detail-item">
                    <p><strong><i class="fas fa-map-marker-alt"></i> Venue:</strong></p>
                    <p>${event.venue}</p>
                </div>
                <div class="detail-item full-width">
                    <p><strong><i class="fas fa-info-circle"></i> Description:</strong></p>
                    <p>${event.description || 'No description provided.'}</p>
                </div>
                <div class="detail-item">
                    <p><strong><i class="fas fa-users"></i> Guest List:</strong></p>
                    <ul class="email-list">
                        ${event.guests && event.guests.length > 0 ? event.guests.map(g => `<li>${g}</li>`).join('') : '<li>No guests listed.</li>'}
                    </ul>
                </div>
                <div class="detail-item">
                    <p><strong><i class="fas fa-user-shield"></i> Staff List:</strong></p>
                    <ul class="email-list">
                        ${event.staff && event.staff.length > 0 ? event.staff.map(s => `<li>${s}</li>`).join('') : '<li>No staff assigned.</li>'}
                    </ul>
                </div>
            `;
        } else {
            detailsContent.innerHTML = '<p>Event not found. It may have been deleted.</p>';
        }
    }
});

