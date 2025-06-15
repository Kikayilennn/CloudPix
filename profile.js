class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.loadProfileData();
        this.loadStats();
    }

    checkAuthStatus() {
        const userData = localStorage.getItem('cloudpix_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        } else {
            // Redirect to projects if not logged in
            window.location.href = 'projects.html';
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('backToProjectsBtn').addEventListener('click', () => {
            window.location.href = 'projects.html';
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Avatar change
        document.getElementById('changeAvatarBtn').addEventListener('click', () => {
            document.getElementById('avatarInput').click();
        });

        document.getElementById('avatarInput').addEventListener('change', (e) => {
            this.handleAvatarChange(e);
        });

        

        // Profile form
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        document.getElementById('resetProfileBtn').addEventListener('click', () => {
            this.resetProfile();
        });
    }

    loadProfileData() {
        const profile = JSON.parse(localStorage.getItem('cloudpix_profile') || '{}');

        // Set current user name in header
        document.getElementById('userName').textContent = 
            this.currentUser.name || this.currentUser.email?.split('@')[0] || 'User';

        // Load form data
        document.getElementById('displayName').value = profile.displayName || this.currentUser.name || '';
        document.getElementById('emailAddress').value = profile.email || this.currentUser.email || '';
        document.getElementById('gender').value = profile.gender || '';
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('location').value = profile.location || '';
        document.getElementById('website').value = profile.website || '';

        // Load avatar
        if (profile.avatar) {
            this.updateAvatar(profile.avatar);
        }
    }

    loadStats() {
        const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
        const userProjects = projects.filter(p => p.user === this.currentUser.email);

        document.getElementById('totalProjects').textContent = userProjects.length;

        // Member since (use registration date or fallback)
        const memberSince = this.currentUser.registrationDate || new Date().toLocaleDateString();
        document.getElementById('memberSince').textContent = memberSince;

        // Total exports (simulate based on projects)
        document.getElementById('totalExports').textContent = Math.floor(userProjects.length * 1.5);
    }

    handleAvatarChange(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.updateAvatar(e.target.result);
                this.showToast('✅ Avatar updated successfully!');
            };
            reader.readAsDataURL(file);
        }
    }

    updateAvatar(avatarData) {
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        avatarPlaceholder.innerHTML = `<img src="${avatarData}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }

    

    

    saveProfile() {
        const profileData = {
            displayName: document.getElementById('displayName').value,
            email: document.getElementById('emailAddress').value,
            gender: document.getElementById('gender').value,
            bio: document.getElementById('bio').value,
            location: document.getElementById('location').value,
            website: document.getElementById('website').value,
            avatar: document.querySelector('#avatarPlaceholder img')?.src || null,
            lastUpdated: new Date().toISOString()
        };

        // Update current user data
        this.currentUser.name = profileData.displayName;
        this.currentUser.email = profileData.email;

        // Save to localStorage
        localStorage.setItem('cloudpix_profile', JSON.stringify(profileData));
        localStorage.setItem('cloudpix_user', JSON.stringify(this.currentUser));

        this.showToast('✅ Profile updated successfully!');
    }

    resetProfile() {
        if (confirm('Are you sure you want to reset your profile?')) {
            localStorage.removeItem('cloudpix_profile');
            this.loadProfileData();
            this.showToast('🔄 Profile reset to defaults');
        }
    }

    logout() {
        localStorage.removeItem('cloudpix_user');
        localStorage.removeItem('cloudpix_profile');
        window.location.href = 'projects.html';
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4f46e5;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize ProfileManager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('profile-page');
    new ProfileManager();
});
