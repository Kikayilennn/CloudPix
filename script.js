class CloudPix {
  constructor() {
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.originalImageData = null;
      this.currentImage = null;
      this.history = [];
      this.historyIndex = -1;
      this.isLoggedIn = false;
      this.currentUser = null;
      this.isGuestMode = false;
      this.isCropMode = false;
      this.currentCropRatio = 'free';
      this.cropOverlay = null;
      this.currentProject = null;
      this.autoSaveInterval = null;

      this.filters = {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          blur: 0,
          filter: 'none'
      };

      this.init();
  }

  init() {
      this.checkAuthStatus();
      this.checkSessionData();
      this.setupEventListeners();
  }

  checkAuthStatus() {
      const userData = localStorage.getItem('cloudpix_user');
      if (userData) {
          this.currentUser = JSON.parse(userData);
          this.isLoggedIn = true;
          this.updateAuthUI();
      }
  }

  checkSessionData() {
      // Check for uploaded file
      const uploadData = sessionStorage.getItem('cloudpix_upload');
      if (uploadData) {
          sessionStorage.removeItem('cloudpix_upload');
          this.loadImageFromData(uploadData);
          this.showMainApp();
          return;
      }

      // Check for template to load
      const templateData = sessionStorage.getItem('cloudpix_template');
      if (templateData) {
          sessionStorage.removeItem('cloudpix_template');
          this.loadImageFromData(templateData);
          this.showMainApp();
          return;
      }

      // Check for project to load
      const projectData = sessionStorage.getItem('cloudpix_load_project');
      if (projectData) {
          sessionStorage.removeItem('cloudpix_load_project');
          this.loadProject(JSON.parse(projectData));
          this.showMainApp();
          return;
      }

      // Check if coming from "Create New" button
      const createNew = sessionStorage.getItem('cloudpix_create_new');
      if (createNew) {
          sessionStorage.removeItem('cloudpix_create_new');
          this.showLandingPage();
          return;
      }

      // Default: show landing page
      this.showLandingPage();
  }

  updateAuthUI() {
      const userSection = document.getElementById('userSection');
      const userProfile = document.getElementById('userProfile');
      const userName = document.getElementById('userName');

      if (this.isLoggedIn && this.currentUser) {
          if (userSection) userSection.style.display = 'none';
          if (userProfile) userProfile.style.display = 'flex';
          if (userName) userName.textContent = this.currentUser.name || this.currentUser.email?.split('@')[0] || 'User';
      } else {
          if (userSection) userSection.style.display = 'flex';
          if (userProfile) userProfile.style.display = 'none';
      }
  }

  setupEventListeners() {
      // Landing page buttons
      document.getElementById('landingLoginBtn').addEventListener('click', () => {
          this.showModal('login');
      });

      document.getElementById('landingRegisterBtn').addEventListener('click', () => {
          this.showModal('register');
      });



      // Authentication
      document.getElementById('loginBtn').addEventListener('click', () => {
          this.showModal('login');
      });

      document.getElementById('registerBtn').addEventListener('click', () => {
          this.showModal('register');
      });

      document.getElementById('logoutBtn').addEventListener('click', () => {
          this.logout();
      });

      document.getElementById('closeModal').addEventListener('click', () => {
          this.hideModal();
      });

      document.getElementById('switchMode').addEventListener('click', (e) => {
          e.preventDefault();
          this.switchAuthMode();
      });

      document.getElementById('authForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleAuth();
      });

      // Password visibility toggles
      document.getElementById('togglePassword').addEventListener('click', () => {
          this.togglePasswordVisibility('password', 'togglePassword');
      });

      document.getElementById('toggleConfirmPassword').addEventListener('click', () => {
          this.togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword');
      });

      // Forgot password functionality
      document.getElementById('forgotPasswordBtn').addEventListener('click', (e) => {
          e.preventDefault();
          this.showForgotPasswordModal();
      });

      document.getElementById('closeForgotModal').addEventListener('click', () => {
          this.hideForgotPasswordModal();
      });

      document.getElementById('backToLogin').addEventListener('click', (e) => {
          e.preventDefault();
          this.hideForgotPasswordModal();
          this.showModal('login');
      });

      document.getElementById('forgotPasswordForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleForgotPassword();
      });

      // File upload
      document.getElementById('uploadBtn').addEventListener('click', () => {
          document.getElementById('fileInput').click();
      });

      document.getElementById('fileInput').addEventListener('change', (e) => {
          this.loadImage(e.target.files[0]);
      });

      // Sliders
      document.getElementById('brightness').addEventListener('input', (e) => {
          this.filters.brightness = parseInt(e.target.value);
          this.updateSliderValue(e.target);
          this.applyFilters();
      });

      document.getElementById('contrast').addEventListener('input', (e) => {
          this.filters.contrast = parseInt(e.target.value);
          this.updateSliderValue(e.target);
          this.applyFilters();
      });

      document.getElementById('saturation').addEventListener('input', (e) => {
          this.filters.saturation = parseInt(e.target.value);
          this.updateSliderValue(e.target);
          this.applyFilters();
      });

      document.getElementById('blur').addEventListener('input', (e) => {
          this.filters.blur = parseInt(e.target.value);
          this.updateSliderValue(e.target);
          this.applyFilters();
      });

      // Filter buttons
      document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              this.filters.filter = e.target.dataset.filter;
              this.applyFilters();
          });
      });

      // Action buttons
      document.getElementById('undoBtn').addEventListener('click', () => {
          this.undo();
      });

      document.getElementById('resetBtn').addEventListener('click', () => {
          this.resetFilters();
      });

      // Export button
      document.getElementById('exportBtn').addEventListener('click', () => {
          this.showExportModal();
      });

      // Export modal controls
      document.getElementById('closeExportModal').addEventListener('click', () => {
          this.hideExportModal();
      });

      document.getElementById('exportQuality').addEventListener('input', (e) => {
          document.getElementById('qualityValue').textContent = e.target.value;
          this.updateQualityVisibility();
      });

      document.getElementById('exportFormat').addEventListener('change', () => {
          this.updateQualityVisibility();
      });

      document.getElementById('downloadBtn').addEventListener('click', () => {
          this.downloadImage();
      });

      document.getElementById('shareExportBtn').addEventListener('click', () => {
          this.shareExportedImage();
      });

      

      // Projects button
      document.getElementById('projectsBtn').addEventListener('click', () => {
          window.location.href = 'projects.html';
      });

      // Add share functionality (we'll add the button to header)
      document.addEventListener('click', (e) => {
          if (e.target.id === 'shareBtn') {
              this.shareProject();
          }
      });

      // Crop controls
      document.getElementById('cropBtn').addEventListener('click', () => {
          this.toggleCropMode();
      });

      document.getElementById('applyCropBtn').addEventListener('click', () => {
          this.applyCrop();
      });

      document.getElementById('cancelCropBtn').addEventListener('click', () => {
          this.cancelCrop();
      });

      document.querySelectorAll('.preset-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              this.currentCropRatio = e.target.dataset.ratio;
          });
      });
  }

  loadImage(file) {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          this.loadImageFromData(e.target.result);
      };
      reader.readAsDataURL(file);
  }

  loadImageFromData(dataUrl) {
      const img = new Image();
      img.onload = () => {
          this.currentImage = img;
          this.setupCanvas(img);
          this.drawImage();
          this.saveState();
          document.getElementById('uploadPlaceholder').style.display = 'none';
          this.canvas.style.display = 'block';

          // Start auto-save when image is loaded
          if (this.isLoggedIn || this.isGuestMode) {
              this.startAutoSave();
          }
      };
      img.src = dataUrl;
  }

  loadProject(projectData) {
      this.currentProject = projectData;
      this.filters = { ...projectData.filters };
      this.loadImageFromData(projectData.imageData);
      this.updateFiltersUI();
  }

  setupCanvas(img) {
      const maxWidth = 800;
      const maxHeight = 600;

      let { width, height } = img;

      if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
      }

      if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
      }

      this.canvas.width = width;
      this.canvas.height = height;
  }

  drawImage() {
      if (!this.currentImage) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);
      this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  applyFilters() {
      if (!this.originalImageData) return;

      const imageData = new ImageData(
          new Uint8ClampedArray(this.originalImageData.data),
          this.originalImageData.width,
          this.originalImageData.height
      );

      this.applyBrightness(imageData);
      this.applyContrast(imageData);
      this.applySaturation(imageData);
      this.applyColorFilter(imageData);

      this.ctx.putImageData(imageData, 0, 0);

      if (this.filters.blur > 0) {
          this.applyBlur();
      }

      this.saveState();
  }

  applyBrightness(imageData) {
      const data = imageData.data;
      const brightness = this.filters.brightness;

      for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, data[i] + brightness));     // Red
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness)); // Green
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness)); // Blue
      }
  }

  applyContrast(imageData) {
      const data = imageData.data;
      const contrast = (this.filters.contrast + 100) / 100;

      for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, (data[i] - 128) * contrast + 128));
          data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * contrast + 128));
          data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * contrast + 128));
      }
  }

  applySaturation(imageData) {
      const data = imageData.data;
      const saturation = (this.filters.saturation + 100) / 100;

      for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          data[i] = Math.max(0, Math.min(255, gray + (r - gray) * saturation));
          data[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * saturation));
          data[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * saturation));
      }
  }

  applyColorFilter(imageData) {
      const data = imageData.data;
      const filter = this.filters.filter;

      for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          switch (filter) {
              case 'grayscale':
                  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                  data[i] = gray;
                  data[i + 1] = gray;
                  data[i + 2] = gray;
                  break;

              case 'sepia':
                  data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                  data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                  data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                  break;

              case 'invert':
                  data[i] = 255 - r;
                  data[i + 1] = 255 - g;
                  data[i + 2] = 255 - b;
                  break;

              case 'pastel':
                  data[i] = Math.min(255, r + (255 - r) * 0.3);
                  data[i + 1] = Math.min(255, g + (255 - g) * 0.3);
                  data[i + 2] = Math.min(255, b + (255 - b) * 0.3);
                  break;

              case 'cool':
                  data[i] = Math.max(0, r - 20);
                  data[i + 1] = Math.min(255, g + 10);
                  data[i + 2] = Math.min(255, b + 30);
                  break;

              case 'warm':
                  data[i] = Math.min(255, r + 30);
                  data[i + 1] = Math.min(255, g + 10);
                  data[i + 2] = Math.max(0, b - 20);
                  break;

              case 'dreamy':
                  const dreamy = (r + g + b) / 3;
                  data[i] = Math.min(255, dreamy * 0.8 + r * 0.4);
                  data[i + 1] = Math.min(255, dreamy * 0.9 + g * 0.3);
                  data[i + 2] = Math.min(255, dreamy * 1.1 + b * 0.2);
                  break;

              case 'neon':
                  data[i] = Math.min(255, r * 1.2 + 50);
                  data[i + 1] = Math.min(255, g * 1.3 + 70);
                  data[i + 2] = Math.min(255, b * 1.1 + 90);
                  break;

              case 'sunset':
                  data[i] = Math.min(255, r * 1.3 + 40);
                  data[i + 1] = Math.min(255, g * 0.8 + 20);
                  data[i + 2] = Math.max(0, b * 0.6 - 30);
                  break;

              case 'ocean':
                  data[i] = Math.max(0, r * 0.7 - 20);
                  data[i + 1] = Math.min(255, g * 1.1 + 10);
                  data[i + 2] = Math.min(255, b * 1.4 + 50);
                  break;

              case 'purple':
                  data[i] = Math.min(255, r * 1.2 + 30);
                  data[i + 1] = Math.max(0, g * 0.8 - 10);
                  data[i + 2] = Math.min(255, b * 1.3 + 60);
                  break;
          }
      }
  }

  applyBlur() {
      this.ctx.filter = `blur(${this.filters.blur}px)`;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;

      tempCtx.drawImage(this.canvas, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(tempCanvas, 0, 0);
      this.ctx.filter = 'none';
  }

  updateSliderValue(slider) {
      const valueSpan = slider.parentNode.querySelector('.value');
      valueSpan.textContent = slider.value;
  }

  resetFilters() {
      this.filters = {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          blur: 0,
          filter: 'none'
      };

      // Reset UI
      document.getElementById('brightness').value = 0;
      document.getElementById('contrast').value = 0;
      document.getElementById('saturation').value = 0;
      document.getElementById('blur').value = 0;

      document.querySelectorAll('.value').forEach(span => span.textContent = '0');
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelector('[data-filter="none"]').classList.add('active');

      this.drawImage();
  }

  showExportModal() {
      if (!this.canvas) {
          this.showToast('❌ No image to export');
          return;
      }

      // Set default filename
      const defaultName = this.currentProject?.name || `cloudpix-${new Date().toLocaleDateString().replace(/\//g, '-')}`;
      document.getElementById('exportFileName').value = defaultName;

      this.updateQualityVisibility();
      document.getElementById('exportModal').style.display = 'flex';
  }

  hideExportModal() {
      document.getElementById('exportModal').style.display = 'none';
  }

  updateQualityVisibility() {
      const format = document.getElementById('exportFormat').value;
      const qualityGroup = document.getElementById('qualityGroup');

      // Show quality slider only for JPEG and WebP
      if (format === 'jpeg' || format === 'webp') {
          qualityGroup.style.display = 'block';
      } else {
          qualityGroup.style.display = 'none';
      }
  }

  downloadImage() {
      if (!this.canvas) return;

      const fileName = document.getElementById('exportFileName').value || 'cloudpix-image';
      const format = document.getElementById('exportFormat').value;
      const quality = parseInt(document.getElementById('exportQuality').value) / 100;

      const formatMap = {
          'png': { type: 'image/png', ext: 'png' },
          'jpeg': { type: 'image/jpeg', ext: 'jpg' },
          'webp': { type: 'image/webp', ext: 'webp' },
          'tiff': { type: 'image/tiff', ext: 'tiff' }
      };

      const selectedFormat = formatMap[format];

      // For TIFF, we'll use PNG as fallback since canvas doesn't natively support TIFF
      const mimeType = format === 'tiff' ? 'image/png' : selectedFormat.type;
      const extension = selectedFormat.ext;

      const link = document.createElement('a');
      link.download = `${fileName}.${extension}`;
      link.href = this.canvas.toDataURL(mimeType, quality);
      link.click();

      this.showToast(`📥 Downloaded as ${selectedFormat.type.toUpperCase()}`);
      this.hideExportModal();

      // Save final version to cloud
      this.saveProjectToCloud();
  }

  shareExportedImage() {
      if (!this.canvas) return;

      const fileName = document.getElementById('exportFileName').value || 'cloudpix-image';

      if (navigator.share && navigator.canShare) {
          this.canvas.toBlob((blob) => {
              const file = new File([blob], `${fileName}.png`, { type: 'image/png' });

              if (navigator.canShare({ files: [file] })) {
                  navigator.share({
                      title: `CloudPix Creation: ${fileName}`,
                      text: 'Check out my CloudPix creation!',
                      files: [file]
                  });
              } else {
                  this.fallbackShare(fileName);
              }
          });
      } else {
          this.fallbackShare(fileName);
      }
  }

  fallbackShare(fileName) {
      // Fallback: show toast message
      this.showToast('📱 Share not available on this device');
  }

  

  // Authentication methods
  showModal(mode) {
      const modal = document.getElementById('modalOverlay');
      const title = document.getElementById('modalTitle');
      const submitBtn = document.getElementById('submitBtn');
      const nameGroup = document.getElementById('nameGroup');
      const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
      const forgotPasswordLink = document.getElementById('forgotPasswordLink');
      const switchText = document.getElementById('switchText');
      const switchMode = document.getElementById('switchMode');

      if (mode === 'login') {
          title.textContent = 'Welcome back! 💕';
          submitBtn.textContent = 'Login ✨';
          nameGroup.style.display = 'none';
          confirmPasswordGroup.style.display = 'none';
          forgotPasswordLink.style.display = 'block';
          switchText.textContent = "Don't have an account?";
          switchMode.textContent = 'Register here! 🌟';
      } else {
          title.textContent = 'Join CloudPix! 🌸';
          submitBtn.textContent = 'Register 💖';
          nameGroup.style.display = 'block';
          confirmPasswordGroup.style.display = 'block';
          forgotPasswordLink.style.display = 'none';
          switchText.textContent = 'Already have an account?';
          switchMode.textContent = 'Login here! ✨';
      }

      modal.dataset.mode = mode;
      modal.style.display = 'flex';
  }

  hideModal() {
      document.getElementById('modalOverlay').style.display = 'none';
      document.getElementById('authForm').reset();
  }

  showForgotPasswordModal() {
      document.getElementById('modalOverlay').style.display = 'none';
      document.getElementById('forgotPasswordModal').style.display = 'flex';
  }

  hideForgotPasswordModal() {
      document.getElementById('forgotPasswordModal').style.display = 'none';
      document.getElementById('forgotPasswordForm').reset();
  }

  handleForgotPassword() {
      const email = document.getElementById('forgotEmail').value;
      
      if (!email) {
          this.showToast('❌ Please enter your email address!');
          return;
      }

      // Check if email exists in our users
      const users = JSON.parse(localStorage.getItem('cloudpix_users') || '[]');
      const user = users.find(u => u.email === email);

      if (user) {
          // Simulate sending reset email
          this.showToast('✅ Password reset link sent to your email!');
          this.hideForgotPasswordModal();
          
          // In a real app, you would send an actual email with a reset token
          console.log(`Password reset requested for: ${email}`);
      } else {
          this.showToast('❌ Email not found in our records!');
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
      const confirmPassword = document.getElementById('confirmPassword').value;
      const name = document.getElementById('name').value;

      // Simulate authentication (in real app, this would be server-side)
      if (mode === 'register') {
          if (name && email && password && confirmPassword) {
              // Check if passwords match
              if (password !== confirmPassword) {
                  this.showToast('❌ Passwords do not match!');
                  return;
              }

              // Check password strength
              if (password.length < 6) {
                  this.showToast('❌ Password must be at least 6 characters!');
                  return;
              }

              // Store user for future login validation
              const users = JSON.parse(localStorage.getItem('cloudpix_users') || '[]');
              const existingUser = users.find(u => u.email === email);

              if (existingUser) {
                  this.showToast('❌ Email already registered!');
                  return;
              }

              users.push({ name, email, password, registrationDate: new Date().toLocaleDateString() });
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
                  this.currentUser = { name: user.name, email: user.email, registrationDate: user.registrationDate };
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
      // Redirect to projects page after login
      window.location.href = 'projects.html';
  }



  showMainApp() {
      document.getElementById('landingPage').style.display = 'none';
      document.getElementById('appContainer').style.display = 'flex';
      document.body.style.overflow = 'hidden';
  }

  showLandingPage() {
      document.getElementById('landingPage').style.display = 'flex';
      document.getElementById('appContainer').style.display = 'none';
      document.body.style.overflow = 'auto';
  }

  logout() {
      this.isLoggedIn = false;
      this.currentUser = null;
      this.isGuestMode = false;
      this.stopAutoSave();
      localStorage.removeItem('cloudpix_user');
      this.updateAuthUI();

      // Redirect to landing page
      window.location.href = 'index.html';
  }

  // Auto-save functionality
  startAutoSave() {
      this.stopAutoSave();
      this.autoSaveInterval = setInterval(() => {
          this.saveProjectToCloud();
      }, 30000); // Auto-save every 30 seconds
  }

  stopAutoSave() {
      if (this.autoSaveInterval) {
          clearInterval(this.autoSaveInterval);
          this.autoSaveInterval = null;
      }
  }

  saveProjectToCloud() {
      if (!this.canvas || !this.currentImage) return;

      const projectData = {
          id: this.currentProject?.id || Date.now().toString(),
          name: this.currentProject?.name || `Project_${new Date().toLocaleDateString()}`,
          imageData: this.canvas.toDataURL(),
          filters: { ...this.filters },
          lastModified: new Date().toISOString(),
          user: this.currentUser?.email || 'guest'
      };

      // Simulate cloud storage (in real app, this would be an API call)
      const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
      const existingIndex = projects.findIndex(p => p.id === projectData.id);

      if (existingIndex >= 0) {
          projects[existingIndex] = projectData;
      } else {
          projects.unshift(projectData);
      }

      // Keep only last 10 projects
      if (projects.length > 10) {
          projects.splice(10);
      }

      localStorage.setItem('cloudpix_projects', JSON.stringify(projects));
      this.currentProject = projectData;

      // Show save confirmation
      this.showToast('✅ Project auto-saved to cloud!');
  }

  loadRecentProjects() {
      const projects = JSON.parse(localStorage.getItem('cloudpix_projects') || '[]');
      return projects.filter(p => p.user === this.currentUser?.email || p.user === 'guest');
  }

  togglePasswordVisibility(inputId, toggleId) {
      const passwordInput = document.getElementById(inputId);
      const toggleButton = document.getElementById(toggleId);
      const icon = toggleButton.querySelector('i');

      if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.className = 'fas fa-eye-slash';
      } else {
          passwordInput.type = 'password';
          icon.className = 'fas fa-eye';
      }
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
          setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
  }

  shareProject() {
      if (!this.currentProject) {
          this.showToast('❌ No project to share');
          return;
      }

      const shareUrl = `${window.location.origin}?project=${this.currentProject.id}`;

      if (navigator.share) {
          navigator.share({
              title: `CloudPix Project: ${this.currentProject.name}`,
              text: 'Check out my CloudPix creation!',
              url: shareUrl
          });
      } else {
          navigator.clipboard.writeText(shareUrl).then(() => {
              this.showToast('🔗 Share link copied to clipboard!');
          });
      }
  }

  // History management
  saveState() {
      if (!this.canvas) return;

      // Remove any states after current index
      this.history = this.history.slice(0, this.historyIndex + 1);

      // Add new state
      this.history.push({
          imageData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
          filters: { ...this.filters }
      });

      this.historyIndex = this.history.length - 1;

      // Limit history size
      if (this.history.length > 20) {
          this.history.shift();
          this.historyIndex--;
      }
  }

  undo() {
      if (this.historyIndex > 0) {
          this.historyIndex--;
          const state = this.history[this.historyIndex];

          this.ctx.putImageData(state.imageData, 0, 0);
          this.filters = { ...state.filters };

          // Update UI
          this.updateFiltersUI();
      }
  }

  updateFiltersUI() {
      document.getElementById('brightness').value = this.filters.brightness;
      document.getElementById('contrast').value = this.filters.contrast;
      document.getElementById('saturation').value = this.filters.saturation;
      document.getElementById('blur').value = this.filters.blur;

      document.querySelectorAll('.value').forEach((span, index) => {
          const values = [this.filters.brightness, this.filters.contrast, this.filters.saturation, this.filters.blur];
          span.textContent = values[index];
      });

      document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.filter === this.filters.filter);
      });
  }

  // Crop functionality
  toggleCropMode() {
      this.isCropMode = !this.isCropMode;
      const cropBtn = document.getElementById('cropBtn');
      const cropPresets = document.getElementById('cropPresets');
      const applyCropBtn = document.getElementById('applyCropBtn');
      const cancelCropBtn = document.getElementById('cancelCropBtn');

      if (this.isCropMode) {
          cropBtn.textContent = '✂️ Crop Mode ON';
          cropBtn.style.background = '#4f46e5';
          cropPresets.style.display = 'grid';
          applyCropBtn.style.display = 'flex';
          cancelCropBtn.style.display = 'flex';
          this.initCropOverlay();
      } else {
          this.cancelCrop();
      }
  }

  initCropOverlay() {
      if (!this.canvas || !this.currentImage) return;

      const canvasContainer = document.getElementById('canvasContainer');
      const canvasRect = this.canvas.getBoundingClientRect();
      const containerRect = canvasContainer.getBoundingClientRect();

      // Remove existing overlay
      if (this.cropOverlay) {
          this.cropOverlay.remove();
      }

      // Calculate overlay position relative to container
      const canvasLeft = canvasRect.left - containerRect.left;
      const canvasTop = canvasRect.top - containerRect.top;
      const canvasWidth = canvasRect.width;
      const canvasHeight = canvasRect.height;

      // Create crop overlay
      this.cropOverlay = document.createElement('div');
      this.cropOverlay.className = 'crop-overlay';
      this.cropOverlay.style.cssText = `
          position: absolute;
          left: ${canvasLeft + canvasWidth * 0.2}px;
          top: ${canvasTop + canvasHeight * 0.2}px;
          width: ${canvasWidth * 0.6}px;
          height: ${canvasHeight * 0.6}px;
          border: 2px dashed #4f46e5;
          background: rgba(79, 70, 229, 0.1);
          cursor: move;
          z-index: 10;
          box-sizing: border-box;
          min-width: 50px;
          min-height: 50px;
      `;

      // Add resize handles
      const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
      handles.forEach(handle => {
          const handleEl = document.createElement('div');
          handleEl.className = `crop-handle crop-handle-${handle}`;
          handleEl.style.cssText = `
              position: absolute;
              width: 10px;
              height: 10px;
              background: #4f46e5;
              border: 2px solid white;
              cursor: ${handle.includes('n') || handle.includes('s') ? 'ns-resize' : 
                        handle.includes('e') || handle.includes('w') ? 'ew-resize' : 
                        handle.includes('nw') || handle.includes('se') ? 'nwse-resize' : 'nesw-resize'};
          `;

          // Position handles
          if (handle.includes('n')) handleEl.style.top = '-5px';
          if (handle.includes('s')) handleEl.style.bottom = '-5px';
          if (handle.includes('e')) handleEl.style.right = '-5px';
          if (handle.includes('w')) handleEl.style.left = '-5px';
          if (!handle.includes('n') && !handle.includes('s')) {
              handleEl.style.top = 'calc(50% - 5px)';
          }
          if (!handle.includes('e') && !handle.includes('w')) {
              handleEl.style.left = 'calc(50% - 5px)';
          }

          this.cropOverlay.appendChild(handleEl);
      });

      canvasContainer.style.position = 'relative';
      canvasContainer.appendChild(this.cropOverlay);

      this.makeDraggable(this.cropOverlay);
      this.makeResizable(this.cropOverlay);
  }

  makeResizable(element) {
      const handles = element.querySelectorAll('.crop-handle');
      handles.forEach(handle => {
          let isResizing = false;
          let startX, startY, startWidth, startHeight, startLeft, startTop;

          handle.addEventListener('mousedown', (e) => {
              isResizing = true;
              e.stopPropagation();
              startX = e.clientX;
              startY = e.clientY;
              startWidth = parseInt(getComputedStyle(element).width);
              startHeight = parseInt(getComputedStyle(element).height);
              startLeft = parseInt(element.style.left);
              startTop = parseInt(element.style.top);
              e.preventDefault();
          });

          document.addEventListener('mousemove', (e) => {
              if (!isResizing) return;

              const deltaX = e.clientX - startX;
              const deltaY = e.clientY - startY;
              const handleClass = handle.className;

              if (handleClass.includes('e')) {
                  element.style.width = Math.max(50, startWidth + deltaX) + 'px';
              }
              if (handleClass.includes('w')) {
                  const newWidth = Math.max(50, startWidth - deltaX);
                  element.style.width = newWidth + 'px';
                  element.style.left = (startLeft + (startWidth - newWidth)) + 'px';
              }
              if (handleClass.includes('s')) {
                  element.style.height = Math.max(50, startHeight + deltaY) + 'px';
              }
              if (handleClass.includes('n')) {
                  const newHeight = Math.max(50, startHeight - deltaY);
                  element.style.height = newHeight + 'px';
                  element.style.top = (startTop + (startHeight - newHeight)) + 'px';
              }
          });

          document.addEventListener('mouseup', () => {
              isResizing = false;
          });
      });
  }

  makeDraggable(element) {
      let isDragging = false;
      let startX, startY, startLeft, startTop;

      element.addEventListener('mousedown', (e) => {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = parseInt(element.style.left);
          startTop = parseInt(element.style.top);
          e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;

          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          element.style.left = (startLeft + deltaX) + 'px';
          element.style.top = (startTop + deltaY) + 'px';
      });

      document.addEventListener('mouseup', () => {
          isDragging = false;
      });
  }

  applyCrop() {
      if (!this.cropOverlay || !this.canvas || !this.currentImage) return;

      const canvasRect = this.canvas.getBoundingClientRect();
      const containerRect = document.getElementById('canvasContainer').getBoundingClientRect();

      // Get overlay position relative to container
      const overlayLeft = parseFloat(this.cropOverlay.style.left);
      const overlayTop = parseFloat(this.cropOverlay.style.top);
      const overlayWidth = parseFloat(this.cropOverlay.style.width);
      const overlayHeight = parseFloat(this.cropOverlay.style.height);

      // Calculate canvas position relative to container
      const canvasLeft = canvasRect.left - containerRect.left;
      const canvasTop = canvasRect.top - containerRect.top;

      // Calculate crop dimensions relative to canvas
      const scaleX = this.canvas.width / canvasRect.width;
      const scaleY = this.canvas.height / canvasRect.height;

      const cropX = Math.max(0, (overlayLeft - canvasLeft) * scaleX);
      const cropY = Math.max(0, (overlayTop - canvasTop) * scaleY);
      const cropWidth = Math.min(this.canvas.width - cropX, overlayWidth * scaleX);
      const cropHeight = Math.min(this.canvas.height - cropY, overlayHeight * scaleY);

      // Ensure valid crop dimensions
      if (cropWidth <= 0 || cropHeight <= 0) {
          this.showToast('❌ Invalid crop area');
          return;
      }

      // Get cropped image data
      const croppedImageData = this.ctx.getImageData(cropX, cropY, cropWidth, cropHeight);

      // Resize canvas and draw cropped image
      this.canvas.width = cropWidth;
      this.canvas.height = cropHeight;
      this.ctx.putImageData(croppedImageData, 0, 0);

      // Update original image data
      this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

      this.cancelCrop();
      this.saveState();
      this.showToast('✅ Image cropped successfully!');
  }

  cancelCrop() {
      this.isCropMode = false;

      if (this.cropOverlay) {
          this.cropOverlay.remove();
          this.cropOverlay = null;
      }

      const cropBtn = document.getElementById('cropBtn');
      const cropPresets = document.getElementById('cropPresets');
      const applyCropBtn = document.getElementById('applyCropBtn');
      const cancelCropBtn = document.getElementById('cancelCropBtn');

      cropBtn.innerHTML = '<i class="fas fa-crop-alt"></i>Enable Crop';
      cropBtn.style.background = '#374151';
      cropPresets.style.display = 'none';
      applyCropBtn.style.display = 'none';
      cancelCropBtn.style.display = 'none';

      document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  }

  setCropRatio(ratio) {
      if (!this.cropOverlay || !this.canvas) return;

      const canvasRect = this.canvas.getBoundingClientRect();
      const containerRect = document.getElementById('canvasContainer').getBoundingClientRect();

      let width, height;

      if (ratio === 'free') {
          // Keep current dimensions
          return;
      } else if (ratio === '1:1') {
          const size = Math.min(canvasRect.width, canvasRect.height) * 0.8;
          width = height = size;
      } else if (ratio === '4:3') {
          const maxWidth = canvasRect.width * 0.8;
          const maxHeight = canvasRect.height * 0.8;

          // Calculate dimensions maintaining 4:3 ratio
          if (maxWidth / maxHeight > 4/3) {
              height = maxHeight;
              width = height * (4/3);
          } else {
              width = maxWidth;
              height = width * (3/4);
          }
      } else if (ratio === '16:9') {
          const maxWidth = canvasRect.width * 0.8;
          const maxHeight = canvasRect.height * 0.8;

          // Calculate dimensions maintaining 16:9 ratio
          if (maxWidth / maxHeight > 16/9) {
              height = maxHeight;
              width = height * (16/9);
          } else {
              width = maxWidth;
              height = width * (9/16);
          }
      }

      // Center the crop overlay
      const left = (canvasRect.width - width) / 2;
      const top = (canvasRect.height - height) / 2;

      this.cropOverlay.style.left = left + 'px';
      this.cropOverlay.style.top = top + 'px';
      this.cropOverlay.style.width = width + 'px';
      this.cropOverlay.style.height = height + 'px';

      // Update preset buttons
      document.querySelectorAll('.preset-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.ratio === ratio);
      });
  }

   init() {
      this.checkAuthStatus();
      this.checkSessionData();
      this.setupEventListeners();
  }

  checkSessionData() {
      // Check for uploaded file
      const uploadData = sessionStorage.getItem('cloudpix_upload');
      if (uploadData) {
          sessionStorage.removeItem('cloudpix_upload');
          this.loadImageFromData(uploadData);
          this.showMainApp();
          return;
      }

      // Check for template to load
      const templateData = sessionStorage.getItem('cloudpix_template');
      if (templateData) {
          sessionStorage.removeItem('cloudpix_template');
          this.loadImageFromData(templateData);
          this.showMainApp();
          return;
      }

      // Check for project to load
      const projectData = sessionStorage.getItem('cloudpix_load_project');
      if (projectData) {
          sessionStorage.removeItem('cloudpix_load_project');
          this.loadProject(JSON.parse(projectData));
          this.showMainApp();
          return;
      }

      // Check if coming from "Create New" button
      const createNew = sessionStorage.getItem('cloudpix_create_new');
      if (createNew) {
          sessionStorage.removeItem('cloudpix_create_new');
          this.showLandingPage();
          return;
      }

      // Default: show landing page
      this.showLandingPage();
  }

  checkForUpload() {
      const uploadData = sessionStorage.getItem('cloudpix_upload');
      const projectData = sessionStorage.getItem('cloudpix_load_project');
      const createNew = sessionStorage.getItem('cloudpix_create_new');

      if (uploadData) {
          sessionStorage.removeItem('cloudpix_upload');
          this.loadImageFromData(uploadData);
      } else if (projectData) {
          sessionStorage.removeItem('cloudpix_load_project');
          const project = JSON.parse(projectData);
          this.loadImageFromData(project.imageData);
      } else if (createNew) {
          sessionStorage.removeItem('cloudpix_create_new');
          // Just show the main app without loading any image
      }
  }

  checkForTemplate() {
      const templateData = sessionStorage.getItem('cloudpix_upload');
      const templateSize = sessionStorage.getItem('cloudpix_template_size');

      if (templateData && templateSize) {
          sessionStorage.removeItem('cloudpix_template_size');
          // Template is already loaded via checkForUpload, size info is available if needed
      }
  }
}

// Initialize CloudPix when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new CloudPix();
});