// Instagram-Style Memories App
document.addEventListener('DOMContentLoaded', function() {
    initializeDemoData();
    updateNavigation();
    loadMemories();
});

// Current user state
let currentUser = null;

// Initialize demo data
function initializeDemoData() {
    // Create default admin account only if no users exist
    if (!localStorage.getItem('demo_users')) {
        const defaultAdmin = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@memories.app',
                password: 'admin123',
                role: 'admin',
                can_post: true,
                created_at: new Date().toISOString(),
                avatar: 'A'
            }
        ];
        localStorage.setItem('demo_users', JSON.stringify(defaultAdmin));
    }

    // Initialize empty memories if none exist
    if (!localStorage.getItem('demo_memories')) {
        localStorage.setItem('demo_memories', JSON.stringify([]));
    }

    // Initialize existing memories with likedBy arrays if they don't have them
    const existingMemories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
    const updatedMemories = existingMemories.map(memory => {
        if (!memory.likedBy) {
            memory.likedBy = [];
        }
        if (!memory.comments) {
            memory.comments = [];
        }
        return memory;
    });
    localStorage.setItem('demo_memories', JSON.stringify(updatedMemories));

    // Load current user if exists
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
}

// Navigation functions
function showHome() {
    hideAllSections();
    document.getElementById('memoriesSection').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('storiesSection').classList.remove('hidden');
    } else {
        document.getElementById('heroSection').classList.remove('hidden');
    }
    
    updateNavigation();
}

function showLoginForm() {
    hideAllSections();
    document.getElementById('loginForm').classList.remove('hidden');
}

function showRegisterForm() {
    hideAllSections();
    document.getElementById('registerForm').classList.remove('hidden');
}

function showAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Admin access required!', 'error');
        return;
    }
    hideAllSections();
    document.getElementById('adminPanel').classList.remove('hidden');
    loadAdminData();
}

function hideAllSections() {
    const sections = [
        'heroSection', 'loginForm', 'registerForm', 'postSection', 
        'noPermission', 'adminPanel', 'memoriesSection', 'storiesSection'
    ];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });
}

function updateNavigation() {
    const adminLink = document.getElementById('adminLink');
    const userWelcome = document.getElementById('userWelcome');
    const userInitial = document.getElementById('userInitial');
    const username = document.getElementById('username');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');
    const postSection = document.getElementById('postSection');
    const noPermission = document.getElementById('noPermission');
    const heroSection = document.getElementById('heroSection');
    const postUserInitial = document.getElementById('postUserInitial');
    const postUsername = document.getElementById('postUsername');

    if (currentUser) {
        // User is logged in
        adminLink.classList.toggle('hidden', currentUser.role !== 'admin');
        userWelcome.classList.remove('hidden');
        userInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        username.textContent = currentUser.username;
        logoutBtn.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        heroSection.classList.add('hidden');

        // Update post form user info
        if (postUserInitial && postUsername) {
            postUserInitial.textContent = currentUser.username.charAt(0).toUpperCase();
            postUsername.textContent = currentUser.username;
        }

        // Show appropriate posting interface
        if (currentUser.can_post || currentUser.role === 'admin') {
            postSection.classList.remove('hidden');
            noPermission.classList.add('hidden');
        } else {
            postSection.classList.add('hidden');
            noPermission.classList.remove('hidden');
        }
    } else {
        // User is not logged in
        adminLink.classList.add('hidden');
        userWelcome.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        postSection.classList.add('hidden');
        noPermission.classList.add('hidden');
        heroSection.classList.remove('hidden');
    }
}

// Authentication functions
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    const errorEl = document.getElementById('loginError');
    const btnEl = document.getElementById('loginSubmitBtn');
    const btnText = btnEl.querySelector('.btn-text');
    const btnLoading = btnEl.querySelector('.btn-loading');
    
    // Clear previous errors
    errorEl.classList.add('hidden');
    btnEl.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        
        // Find user with matching credentials
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            throw new Error('Invalid username or password.');
        }
        
        // Set current user and create session
        currentUser = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        localStorage.setItem('auth_token', `token_${user.id}_${Date.now()}`);
        
        // Show success and redirect
        showToast(`Welcome back, ${user.username}!`, 'success');
        setTimeout(() => {
            showHome();
        }, 1000);
        
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        
        btnEl.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    const errorEl = document.getElementById('registerError');
    const successEl = document.getElementById('registerSuccess');
    const btnEl = document.getElementById('registerSubmitBtn');
    const btnText = btnEl.querySelector('.btn-text');
    const btnLoading = btnEl.querySelector('.btn-loading');
    
    // Clear messages
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    btnEl.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Validation
        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }
        
        // Check if user exists
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        if (users.find(u => u.username === username)) {
            throw new Error('Username already taken. Please choose another.');
        }
        if (users.find(u => u.email === email)) {
            throw new Error('Email already registered. Try signing in instead.');
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            role: 'member',
            can_post: false,
            created_at: new Date().toISOString(),
            avatar: username.charAt(0).toUpperCase()
        };
        
        users.push(newUser);
        localStorage.setItem('demo_users', JSON.stringify(users));
        
        // Show success
        successEl.textContent = 'Account created successfully! You can now sign in. An admin will need to approve your posting access.';
        successEl.classList.remove('hidden');
        
        // Reset form
        document.getElementById('registerForm').querySelector('form').reset();
        
        setTimeout(() => {
            showLoginForm();
        }, 2500);
        
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        
        btnEl.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
    showToast('Logged out successfully!', 'success');
    setTimeout(() => {
        showHome();
    }, 1000);
}

// Image upload handling
function triggerFileUpload() {
    document.getElementById('memoryImageFile').click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('memoryImage').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Memory posting - FIXED VERSION
async function handlePostMemory(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showToast('Please sign in to post memories!', 'error');
        return;
    }
    
    const title = document.getElementById('memoryTitle').value.trim();
    const description = document.getElementById('memoryDescription').value.trim();
    const imageUrl = document.getElementById('memoryImage').value.trim();
    
    const errorEl = document.getElementById('postError');
    const btnEl = document.getElementById('postBtn');
    const btnText = btnEl.querySelector('.btn-text');
    const btnLoading = btnEl.querySelector('.btn-loading');
    
    // Clear previous errors
    errorEl.classList.add('hidden');
    btnEl.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    try {
        // Check if server is available by testing the API endpoint
        const testResponse = await fetch('/api/memories').catch(() => null);
        
        if (testResponse && testResponse.ok) {
            // Use server API
            const response = await fetch('/api/memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    image_url: imageUrl,
                    username: currentUser.username,
                    user_id: currentUser.id
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to post to server');
            }
        } else {
            // Fallback to localStorage (demo mode)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Validate inputs
            if (!title || !imageUrl) {
                throw new Error('Caption and image URL are required');
            }
            
            // Validate URL format
            try {
                new URL(imageUrl);
            } catch {
                throw new Error('Please enter a valid image URL');
            }
            
            // Add new memory to localStorage
            const memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
            const newMemory = {
                id: Date.now(),
                user_id: currentUser.id,
                username: currentUser.username,
                title,
                description,
                image_url: imageUrl,
                likes: 0,
                likedBy: [],
                comments: [],
                created_at: new Date().toISOString(),
                avatar: currentUser.username.charAt(0).toUpperCase()
            };
            
            memories.unshift(newMemory);
            localStorage.setItem('demo_memories', JSON.stringify(memories));
        }
        
        // Reset form
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryDescription').value = '';
        document.getElementById('memoryImage').value = '';
        document.getElementById('memoryImageFile').value = '';
        
        // Reload memories and show success
        await loadMemories();
        showToast('Post shared successfully!', 'success');
        
    } catch (error) {
        errorEl.textContent = error.message || 'Failed to post memory';
        errorEl.classList.remove('hidden');
    } finally {
        btnEl.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

// Load and display memories - FIXED VERSION
async function loadMemories() {
    const container = document.getElementById('memoriesContainer');
    
    try {
        // Try to load from server first
        const response = await fetch("/api/memories").catch(() => null);
        let memories = [];
        
        if (response && response.ok) {
            memories = await response.json();
            // Convert server format to match our display format
            memories = memories.map(memory => ({
                id: memory._id,
                user_id: memory.user_id,
                username: memory.username,
                title: memory.title,
                description: memory.description,
                image_url: memory.image_url,
                likes: memory.likes || 0,
                likedBy: memory.likedBy || [],
                comments: memory.comments || [],
                created_at: memory.created_at,
                avatar: memory.username.charAt(0).toUpperCase()
            }));
        } else {
            // Fallback to localStorage
            memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
        }
        
        if (memories.length === 0) {
            container.innerHTML = `
                <div class="memory-card">
                    <div class="memory-content" style="text-align: center; padding: 40px;">
                        <i class="fas fa-camera" style="font-size: 48px; color: var(--ig-text-secondary); margin-bottom: 16px;"></i>
                        <h3>No posts yet</h3>
                        <p style="color: var(--ig-text-secondary); margin-top: 8px;">Be the first to share a precious moment!</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = memories.map(memory => {
            const hasLiked = currentUser && memory.likedBy && memory.likedBy.includes(currentUser.id);
            const heartIcon = hasLiked ? 'fas fa-heart' : 'far fa-heart';
            const heartColor = hasLiked ? 'color: var(--ig-danger);' : '';
            
            return `
            <div class="memory-card">
                ${(currentUser && (currentUser.id === memory.user_id || currentUser.role === 'admin')) ? `
                    <button class="delete-btn" onclick="deleteMemory('${memory.id}')" title="Delete post">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
                
                <div class="memory-header">
                    <div class="memory-avatar">${memory.avatar || memory.username.charAt(0).toUpperCase()}</div>
                    <div class="memory-user-info">
                        <div class="memory-username">${memory.username}</div>
                        <div class="memory-date">${formatDate(memory.created_at)}</div>
                    </div>
                </div>
                
                <img 
                    src="${memory.image_url}" 
                    alt="${memory.title}"
                    class="memory-image"
                    onerror="this.src='https://via.placeholder.com/600x400/f0f0f0/999?text=Image+Not+Found'"
                    loading="lazy"
                />
                
                <div class="memory-actions">
                    <button class="action-btn ${hasLiked ? 'liked' : ''}" onclick="toggleLike('${memory.id}')" style="${heartColor}">
                        <i class="${heartIcon}"></i>
                    </button>
                    <button class="action-btn" onclick="showComments('${memory.id}')">
                        <i class="far fa-comment"></i>
                    </button>
                    <button class="action-btn">
                        <i class="far fa-paper-plane"></i>
                    </button>
                </div>
                
                <div class="memory-content">
                    <div class="memory-likes">${memory.likes || 0} likes</div>
                    <div class="memory-title">
                        <span class="memory-username-inline">${memory.username}</span>
                        ${memory.title}
                    </div>
                    ${memory.description ? `
                        <div class="memory-description">${memory.description}</div>
                    ` : ''}
                    <div class="memory-comments" id="comments-${memory.id}">
                        ${memory.comments && memory.comments.length > 0 ? `
                            <div class="comments-list">
                                ${memory.comments.slice(0, 2).map(comment => `
                                    <div class="comment">
                                        <span class="comment-username">${comment.username}</span>
                                        <span class="comment-text">${comment.text}</span>
                                    </div>
                                `).join('')}
                                ${memory.comments.length > 2 ? `
                                    <div class="view-all-comments" onclick="showComments('${memory.id}')">
                                        View all ${memory.comments.length} comments
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        ${currentUser ? `
                            <div class="add-comment">
                                <input type="text" placeholder="Add a comment..." class="comment-input" 
                                       onkeypress="handleCommentSubmit(event, '${memory.id}')">
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error("Failed to load memories", error);
        container.innerHTML = `
            <div class="memory-card">
                <div class="memory-content" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--ig-danger); margin-bottom: 16px;"></i>
                    <h3>Failed to load posts</h3>
                    <p style="color: var(--ig-text-secondary); margin-top: 8px;">Please try refreshing the page.</p>
                </div>
            </div>
        `;
    }
}

// Comment functionality
function handleCommentSubmit(event, memoryId) {
    if (event.key !== 'Enter') return;
    
    if (!currentUser) {
        showToast('Please sign in to comment!', 'error');
        return;
    }
    
    const commentText = event.target.value.trim();
    if (!commentText) return;
    
    const memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
    const memoryIndex = memories.findIndex(m => m.id == memoryId);
    
    if (memoryIndex !== -1) {
        if (!memories[memoryIndex].comments) {
            memories[memoryIndex].comments = [];
        }
        
        memories[memoryIndex].comments.push({
            id: Date.now(),
            userId: currentUser.id,
            username: currentUser.username,
            text: commentText,
            created_at: new Date().toISOString()
        });
        
        localStorage.setItem('demo_memories', JSON.stringify(memories));
        event.target.value = '';
        loadMemories();
        showToast('Comment added!', 'success');
    }
}

function showComments(memoryId) {
    const memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
    const memory = memories.find(m => m.id == memoryId);
    
    if (memory && memory.comments) {
        const commentsText = memory.comments.map(c => `${c.username}: ${c.text}`).join('\n');
        alert(`Comments on this post:\n\n${commentsText}`);
    } else {
        alert('No comments yet. Be the first to comment!');
    }
}

// Delete memory functionality
async function deleteMemory(memoryId) {
    if (!currentUser) {
        showToast('Please sign in to delete posts!', 'error');
        return;
    }
    
    // Get memory details for permission check
    const memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
    const memory = memories.find(m => m.id == memoryId);
    
    if (!memory) {
        showToast('Post not found!', 'error');
        return;
    }
    
    // Check permissions: user can delete own posts, admin can delete any post
    if (memory.user_id !== currentUser.id && currentUser.role !== 'admin') {
        showToast('You can only delete your own posts!', 'error');
        return;
    }
    
    // Confirm deletion
    const isOwnPost = memory.user_id === currentUser.id;
    const confirmMessage = isOwnPost 
        ? 'Are you sure you want to delete this post?' 
        : `Are you sure you want to delete @${memory.username}'s post?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Try server delete first
        const response = await fetch(`/api/memories/${memoryId}`, {
            method: 'DELETE'
        }).catch(() => null);
        
        if (!response || !response.ok) {
            // Fallback to localStorage
            const updatedMemories = memories.filter(m => m.id != memoryId);
            localStorage.setItem('demo_memories', JSON.stringify(updatedMemories));
        }
        
        // Reload memories and show success
        loadMemories();
        const action = isOwnPost ? 'Your post has been deleted' : 'Post deleted successfully';
        showToast(action, 'success');
        
    } catch (error) {
        showToast('Failed to delete post. Please try again.', 'error');
    }
}

// Like functionality
function toggleLike(memoryId) {
    if (!currentUser) {
        showToast('Please sign in to like posts!', 'error');
        return;
    }
    
    const memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
    const memoryIndex = memories.findIndex(m => m.id == memoryId);
    
    if (memoryIndex !== -1) {
        const memory = memories[memoryIndex];
        
        // Initialize likes array if it doesn't exist
        if (!memory.likedBy) {
            memory.likedBy = [];
        }
        
        const hasLiked = memory.likedBy.includes(currentUser.id);
        
        if (hasLiked) {
            // Unlike: remove user from likedBy array and decrease count
            memory.likedBy = memory.likedBy.filter(userId => userId !== currentUser.id);
            memory.likes = Math.max(0, (memory.likes || 0) - 1);
            showToast('Unliked!', 'info');
        } else {
            // Like: add user to likedBy array and increase count
            memory.likedBy.push(currentUser.id);
            memory.likes = (memory.likes || 0) + 1;
            showToast('Liked!', 'success');
        }
        
        localStorage.setItem('demo_memories', JSON.stringify(memories));
        loadMemories();
    }
}

// Admin functions
function loadAdminData() {
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const memories = JSON.parse(localStorage.getItem('demo_memories') || '[]');
    
    // Update stats
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('activePosters').textContent = users.filter(u => u.can_post).length;
    document.getElementById('totalMemories').textContent = memories.length;
    
    // Load users table
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    <i class="fas fa-users" style="font-size: 24px; margin-bottom: 8px; color: var(--ig-text-secondary);"></i>
                    <br>No users found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr class="user-row">
            <td>
                <div class="user-info">
                    <strong>@${user.username}</strong>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="role-badge role-${user.role}">
                    ${user.role === 'admin' ? '<i class="fas fa-crown"></i>' : '<i class="fas fa-user"></i>'} ${user.role}
                </span>
            </td>
            <td>
                <span class="permission-badge ${user.can_post ? 'permission-yes' : 'permission-no'}">
                    ${user.can_post ? '<i class="fas fa-check"></i> Yes' : '<i class="fas fa-times"></i> No'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                ${user.role !== 'admin' ? `
                    <button 
                        class="btn ${user.can_post ? 'btn-danger' : 'btn-success'} btn-sm"
                        onclick="togglePermission(${user.id}, ${user.can_post})"
                    >
                        <i class="fas ${user.can_post ? 'fa-times' : 'fa-check'}"></i>
                        ${user.can_post ? 'Revoke' : 'Grant'}
                    </button>
                ` : '<span class="text-muted">Admin</span>'}
            </td>
        </tr>
    `).join('');
}

async function togglePermission(userId, currentPermission) {
    const errorEl = document.getElementById('adminError');
    const successEl = document.getElementById('adminSuccess');
    
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update user permission
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].can_post = !currentPermission;
            localStorage.setItem('demo_users', JSON.stringify(users));
            
            // Update current user if it's the same user
            if (currentUser && currentUser.id === userId) {
                currentUser.can_post = !currentPermission;
                localStorage.setItem('current_user', JSON.stringify(currentUser));
                updateNavigation();
            }
            
            const action = !currentPermission ? 'granted' : 'revoked';
            const user = users[userIndex];
            successEl.textContent = `Posting permission ${action} for @${user.username}`;
            successEl.classList.remove('hidden');
            
            loadAdminData();
            
            // Hide success message after 3 seconds
            setTimeout(() => successEl.classList.add('hidden'), 3000);
        } else {
            throw new Error('User not found');
        }
        
    } catch (error) {
        errorEl.textContent = error.message || 'Failed to update permissions';
        errorEl.classList.remove('hidden');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (minutes < 1) {
        return 'now';
    } else if (minutes < 60) {
        return `${minutes}m`;
    } else if (hours < 24) {
        return `${hours}h`;
    } else if (days < 7) {
        return `${days}d`;
    } else if (weeks < 4) {
        return `${weeks}w`;
    } else {
        return date.toLocaleDateString();
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // Set icon based on type
    let iconClass = 'fas fa-info-circle';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
    
    toastIcon.className = `toast-icon ${iconClass}`;
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        hideToast();
    }, 3000);
}

function hideToast() {
    document.getElementById('toast').classList.add('hidden');
}

// Search functionality (placeholder)
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            // Placeholder for search functionality
            console.log('Searching for:', query);
        });
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modals/forms
    if (e.key === 'Escape') {
        if (currentUser) {
            showHome();
        }
    }
    
    // Ctrl/Cmd + / for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});