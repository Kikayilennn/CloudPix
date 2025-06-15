class ProjectsManager {
  constructor() {
      this.isLoggedIn = false;
      this.currentUser = null;
      this.selectedProject = null;
      this.init();
  }

  init() {
      this.checkAuthStatus();
      this.setupEventListeners();
      this.loadProjects();
  }

  checkAuthStatus() {
      // Check if user is logged in from localStorage or session
      const userData = localStorage.getItem('cloudpix_user');
      if (userData) {
          this.currentUser = JSON.parse(userData);
          this.isLoggedIn = true;
          this.updateAuthUI();
      } else {
          // Stay on projects page but show login options
          this.updateAuthUI();
      }
  }

  updateAuthUI() {
      const userSection = document.getElementById('userSection');
      const userProfile = document.getElementById('userProfile');
      const userName = document.getElementById('userName');

      if (this.isLoggedIn && this.currentUser) {
          userSection.style.display = 'none';
          userProfile.style.display = 'flex';
          userName.textContent = this.currentUser.name || this.currentUser.email?.split('@')[0] || 'User';
      } else {
          userSection.style.display = 'flex';
          userProfile.style.display = 'none';
      }
  }

  setupEventListeners() {
      // Auth buttons
      const loginBtn = document.getElementById('loginBtn');
      const registerBtn = document.getElementById('registerBtn');
      const logoutBtn = document.getElementById('logoutBtn');

      if (loginBtn) {
          loginBtn.addEventListener('click', () => this.showModal('login'));
      }
      if (registerBtn) {
          registerBtn.addEventListener('click', () => this.showModal('register'));
      }
      if (logoutBtn) {
          logoutBtn.addEventListener('click', () => this.logout());
      }

      // Profile link
      const userProfileLink = document.getElementById('userProfileLink');
      if (userProfileLink) {
          userProfileLink.addEventListener('click', () => {
              if (this.isLoggedIn) {
                  window.location.href = 'profile.html';
              }
          });
      }

      // Modal controls
      const closeModal = document.getElementById('closeModal');
      const switchMode = document.getElementById('switchMode');
      const authForm = document.getElementById('authForm');

      if (closeModal) {
          closeModal.addEventListener('click', () => this.hideModal());
      }
      if (switchMode) {
          switchMode.addEventListener('click', (e) => {
              e.preventDefault();
              this.switchAuthMode();
          });
      }
      if (authForm) {
          authForm.addEventListener('submit', (e) => {
              e.preventDefault();
              this.handleAuth();
          });
      }

      // Project actions
      const uploadImageBtn = document.getElementById('uploadImageBtn');
      const howItWorksBtn = document.getElementById('howItWorksBtn');
      const fileInput = document.getElementById('fileInput');
      if (uploadImageBtn) {
          uploadImageBtn.addEventListener('click', () => this.uploadAndEdit());
      }
      if (howItWorksBtn) {
          howItWorksBtn.addEventListener('click', () => this.showHowItWorks());
      }
      if (fileInput) {
          fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
      }

      // How It Works modal
      const closeHowItWorksModal = document.getElementById('closeHowItWorksModal');
      if (closeHowItWorksModal) {
          closeHowItWorksModal.addEventListener('click', () => this.hideHowItWorks());
      }

      // View options
      document.querySelectorAll('.view-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              this.switchView(e.target.dataset.view);
          });
      });

      // Project modal
      const closeProjectModal = document.getElementById('closeProjectModal');
      if (closeProjectModal) {
          closeProjectModal.addEventListener('click', () => this.hideProjectModal());
      }

      // Project action buttons
      const openProjectBtn = document.getElementById('openProjectBtn');
      const duplicateProjectBtn = document.getElementById('duplicateProjectBtn');
      const exportProjectBtn = document.getElementById('exportProjectBtn');
      const shareProjectBtn = document.getElementById('shareProjectBtn');
      const deleteProjectBtn = document.getElementById('deleteProjectBtn');

      if (openProjectBtn) {
          openProjectBtn.addEventListener('click', () => this.openProject());
      }
      if (duplicateProjectBtn) {
          duplicateProjectBtn.addEventListener('click', () => this.duplicateProject());
      }
      if (exportProjectBtn) {
          exportProjectBtn.addEventListener('click', () => this.exportProject());
      }
      if (shareProjectBtn) {
          shareProjectBtn.addEventListener('click', () => this.shareProject());
      }
      if (deleteProjectBtn) {
          deleteProjectBtn.addEventListener('click', () => this.deleteProject());
      }
  }



  uploadAndEdit() {
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
          fileInput.click();
      }
  }

  handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
          // Store the file in sessionStorage and redirect to editor
          const reader = new FileReader();
          reader.onload = (e) => {
              sessionStorage.setItem('cloudpix_upload', e.target.result);
              window.location.href = 'index.html';
          };
          reader.readAsDataURL(file);
      }
  }



  showHowItWorks() {
      document.getElementById('howItWorksModal').style.display = 'flex';
  }

  hideHowItWorks() {
      document.getElementById('howItWorksModal').style.display = 'none';
  }

  loadProjects() {
      const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
      const userProjects = projects.filter(p => 
          p.user === (this.currentUser?.email || 'guest') || 
          (!this.isLoggedIn && p.user === 'guest')
      );

      const projectsGrid = document.getElementById('projectsGrid');
      const emptyState = document.getElementById('emptyState');

      if (userProjects.length === 0) {
          projectsGrid.style.display = 'none';
          emptyState.style.display = 'flex';
      } else {
          projectsGrid.style.display = 'grid';
          emptyState.style.display = 'none';
          this.renderProjects(userProjects);
      }
  }

  renderProjects(projects) {
      const projectsGrid = document.getElementById('projectsGrid');
      projectsGrid.innerHTML = '';

      projects.forEach(project => {
          const projectCard = document.createElement('div');
          projectCard.className = 'project-card';
          projectCard.innerHTML = `
              <div class="project-thumbnail">
                  <img src="${project.imageData}" alt="${project.name}" loading="lazy">
              </div>
              <div class="project-info">
                  <h3>${project.name}</h3>
                  <p class="project-date">${new Date(project.lastModified).toLocaleDateString()}</p>
                  <div class="project-actions">
                      <button class="btn btn-primary btn-sm" onclick="projectsManager.openProjectById('${project.id}')">
                          <i class="fas fa-edit"></i> Edit
                      </button>
                      <button class="btn btn-secondary btn-sm" onclick="projectsManager.showProjectModal('${project.id}')">
                          <i class="fas fa-ellipsis-h"></i>
                      </button>
                  </div>
              </div>
          `;
          projectsGrid.appendChild(projectCard);
      });
  }

  openProjectById(projectId) {
      const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
      const project = projects.find(p => p.id === projectId);
      if (project) {
          sessionStorage.setItem('cloudpix_load_project', JSON.stringify(project));
          window.location.href = 'index.html';
      }
  }

  showProjectModal(projectId) {
      this.selectedProject = projectId;
      const modal = document.getElementById('projectModal');
      if (modal) {
          modal.style.display = 'flex';
      }
  }

  hideProjectModal() {
      const modal = document.getElementById('projectModal');
      if (modal) {
          modal.style.display = 'none';
      }
      this.selectedProject = null;
  }

  openProject() {
      if (this.selectedProject) {
          this.openProjectById(this.selectedProject);
      }
      this.hideProjectModal();
  }

  duplicateProject() {
      if (!this.selectedProject) return;

      const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
      const project = projects.find(p => p.id === this.selectedProject);

      if (project) {
          const duplicated = {
              ...project,
              id: Date.now().toString(),
              name: `${project.name} (Copy)`,
              lastModified: new Date().toISOString()
          };

          projects.unshift(duplicated);
          localStorage.setItem('cloudpix_projects', JSON.stringify(projects));
          this.loadProjects();
          this.showToast('✅ Project duplicated!');
      }
      this.hideProjectModal();
  }

  exportProject() {
      if (!this.selectedProject) return;

      const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
      const project = projects.find(p => p.id === this.selectedProject);

      if (project) {
          const link = document.createElement('a');
          link.download = `${project.name}.png`;
          link.href = project.imageData;
          link.click();
          this.showToast('📥 Project exported!');
      }
      this.hideProjectModal();
  }

  shareProject() {
      if (!this.selectedProject) return;

      const shareUrl = `${window.location.origin}?project=${this.selectedProject}`;

      if (navigator.share) {
          navigator.share({
              title: 'CloudPix Project',
              text: 'Check out my CloudPix creation!',
              url: shareUrl
          });
      } else {
          navigator.clipboard.writeText(shareUrl).then(() => {
              this.showToast('🔗 Share link copied!');
          });
      }
      this.hideProjectModal();
  }

  deleteProject() {
      if (!this.selectedProject) return;

      if (confirm('Are you sure you want to delete this project?')) {
          const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
          const filteredProjects = projects.filter(p => p.id !== this.selectedProject);
          localStorage.setItem('cloudpix_projects', JSON.stringify(filteredProjects));
          this.loadProjects();
          this.showToast('🗑️ Project deleted!');
      }
      this.hideProjectModal();
  }

  switchView(viewType) {
      const projectsGrid = document.getElementById('projectsGrid');
      if (viewType === 'list') {
          projectsGrid.classList.add('list-view');
      } else {
          projectsGrid.classList.remove('list-view');
      }
  }

  // Auth methods
  showModal(mode) {
      const modal = document.getElementById('modalOverlay');
      const title = document.getElementById('modalTitle');
      const submitBtn = document.getElementById('submitBtn');
      const nameGroup = document.getElementById('nameGroup');
      const switchText = document.getElementById('switchText');
      const switchMode = document.getElementById('switchMode');

      if (mode === 'login') {
          title.textContent = 'Welcome back! 💕';
          submitBtn.textContent = 'Login ✨';
          nameGroup.style.display = 'none';
          switchText.textContent = "Don't have an account?";
          switchMode.textContent = 'Register here! 🌟';
      } else {
          title.textContent = 'Join CloudPix! 🌸';
          submitBtn.textContent = 'Register 💖';
          nameGroup.style.display = 'block';
          switchText.textContent = 'Already have an account?';
          switchMode.textContent = 'Login here! ✨';
      }

      modal.dataset.mode = mode;
      modal.style.display = 'flex';
  }

  hideModal() {
      const modal = document.getElementById('modalOverlay');
      if (modal) {
          modal.style.display = 'none';
      }
      const authForm = document.getElementById('authForm');
      if (authForm) {
          authForm.reset();
      }
  }

  switchAuthMode() {
      const currentMode = document.getElementById('modalOverlay').dataset.mode;
      this.showModal(currentMode === 'login' ? 'register' : 'login');
  }

  handleAuth() {
      const mode = document.getElementById('modalOverlay').dataset.mode;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const name = document.getElementById('name').value;

      // Simulate authentication (in real app, this would be server-side)
      if (mode === 'register') {
          if (name && email && password) {
              // Store user for future login validation
              const users = JSON.parse(localStorage.getItem('cloudpix_users') || '[]');
              const existingUser = users.find(u => u.email === email);

              if (existingUser) {
                  this.showToast('❌ Email already registered!');
                  return;
              }

              users.push({ name, email, password });
              localStorage.setItem('cloudpix_users', JSON.stringify(users));

              this.currentUser = { name, email, registrationDate: new Date().toLocaleDateString() };
              this.login(name);
          } else {
              this.showToast('❌ Please fill in all fields!');
          }
      } else {
          if (email && password) {
              // Validate credentials
              const users = JSON.parse(localStorage.getItem('cloudpix_users') || '[]');
              const user = users.find(u => u.email === email && u.password === password);

              if (user) {
                  this.currentUser = { name: user.name, email: user.email, registrationDate: new Date().toLocaleDateString() };
                  this.login(user.name);
              } else {
                  this.showToast('❌ Invalid email or password!');
                  return;
              }
          } else {
              this.showToast('❌ Please enter email and password!');
          }
      }
  }

  login(userName) {
      this.isLoggedIn = true;
      localStorage.setItem('cloudpix_user', JSON.stringify(this.currentUser));
      this.updateAuthUI();
      this.hideModal();
      this.loadProjects();
      this.showToast(`✅ Successfully logged in as ${userName}!`);
  }

  logout() {
      this.isLoggedIn = false;
      this.currentUser = null;
      localStorage.removeItem('cloudpix_user');
      this.updateAuthUI();
      window.location.href = '/'; // Redirect to landing page after logout
      this.showToast('👋 Logged out successfully!');
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

// Initialize ProjectsManager when the page loads
let projectsManager;
document.addEventListener('DOMContentLoaded', () => {
  // Add class to body for projects page styling
  document.body.classList.add('projects-page');
  projectsManager = new ProjectsManager();
});