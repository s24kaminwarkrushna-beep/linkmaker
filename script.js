// ========================================
// FIREBASE SETUP
// LINKMAKER - URL SHORTENER APPLICATION
// ========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔴 REPLACE WITH YOUR OWN FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB9hswCz4qUriPm5WR7_W2Y4N0g7D-pReI",
  authDomain: "linkmaker-735e9.firebaseapp.com",
  projectId: "linkmaker-735e9",
  appId: "1:247697787542:web:9e7a352fcff462cd0b10b7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account"
});

console.log("🔥 Firebase connected successfully");
// ========================================
// LOGIN MODAL HANDLING  ✅ PASTE HERE
// ========================================
const loginBtn = document.getElementById("loginBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");

loginBtn?.addEventListener("click", () => {
  loginModal.classList.remove("hidden");
});

mobileLoginBtn?.addEventListener("click", () => {
  loginModal.classList.remove("hidden");
});

closeModal?.addEventListener("click", () => {
  loginModal.classList.add("hidden");
});
// ========================================
// GLOBAL DATA
// ========================================
// Storage for URL mappings with metadata
const urlDatabase = new Map();
const linksHistory = [];

// ========================================
// GOOGLE LOGIN
// ========================================
document.addEventListener("click", async (e) => {
  const googleBtn = e.target.closest("#googleLoginBtn");
  if (!googleBtn) return;

  try {
    console.log("🔥 Google login clicked");

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("✅ Logged in:", user.email);

    // Save to localStorage for persistence across page reloads
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userDisplayName", user.displayName || "User");

    // Close modal if open
    const loginModal = document.getElementById("loginModal");
    if (loginModal) loginModal.classList.add("hidden");
    
    // Refresh UI
    updateUIForLogin();
    
    // Optional: Reload page to ensure everything syncs
    // window.location.reload();
  } catch (err) {
    console.error("❌ Login failed", err);
    alert("Google login failed. Please check your console for details.");
  }
});

// ========================================
// AUTH STATE HANDLER (FIREBASE)
// ========================================
onAuthStateChanged(auth, (user) => {
  const navUserArea = document.getElementById("navUserArea");
  const mobileUserArea = document.getElementById("mobileUserArea");

  if (user) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userDisplayName", user.displayName || "User");
    updateUIForLogin();
  } else {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userDisplayName");

    // 🔥 RESTORE LOGIN BUTTON (DESKTOP)
    if (navUserArea) {
      navUserArea.innerHTML = `
        <button class="btn-login" id="loginBtn">Login</button>
      `;

      // reattach modal click
      document
        .getElementById("loginBtn")
        ?.addEventListener("click", () => {
          document.getElementById("loginModal")?.classList.remove("hidden");
        });
    }

    // 🔥 RESTORE LOGIN BUTTON (MOBILE)
    if (mobileUserArea) {
      mobileUserArea.innerHTML = `
        <button class="btn-login" id="mobileLoginBtn">Login</button>
      `;

      document
        .getElementById("mobileLoginBtn")
        ?.addEventListener("click", () => {
          document.getElementById("loginModal")?.classList.remove("hidden");
        });
    }
  }
});


// ========================================
// LOGOUT
// ========================================
window.logoutUser = async () => {
  try {
    await signOut(auth);
    localStorage.clear();
    window.location.reload();
  } catch (err) {
    console.error("Logout failed", err);
  }
};

// ========================================
// UI LOGIN STATE
// ========================================
function updateUIForLogin() {
  const navUserArea = document.getElementById("navUserArea");
  const mobileUserArea = document.getElementById("mobileUserArea");

  const name = localStorage.getItem("userDisplayName") || "User";
  const initial = name.charAt(0).toUpperCase();
  const displayNavName = name.length > 12 ? name.substring(0, 10) + '...' : name;

  if (navUserArea) {
    navUserArea.innerHTML = `
      <div class="user-profile-nav" onclick="window.location.href='profile.html'">
        <div class="user-avatar">${initial}</div>
        <span class="user-name">${displayNavName}</span>
      </div>
    `;
  }

  if (mobileUserArea) {
    mobileUserArea.innerHTML = `
      <div class="mobile-user-profile">
        <div class="user-avatar">${initial}</div>
        <div style="display: flex; flex-direction: column;">
          <span class="user-name" onclick="window.location.href='profile.html'">${name}</span>
          <a href="#" onclick="logoutUser()" style="margin-left: 0; margin-top: 4px;">Logout</a>
        </div>
      </div>
    `;
  }
}

// ========================================
// DOM ELEMENTS
// ========================================
// DOM Elements
const urlInput = document.getElementById('urlInput');
const shortenBtn = document.getElementById('shortenBtn');
const btnText = document.querySelector('.btn-text');
@@ -201,6 +28,7 @@ const totalLinksEl = document.getElementById('totalLinks');
const totalClicksEl = document.getElementById('totalClicks');
const activeLinksEl = document.getElementById('activeLinks');
const linkChangeEl = document.getElementById('linkChange');
// refreshBtn removed

// Dashboard Data
let dashboardData = {
@@ -306,12 +134,11 @@ function hideError() {
*/
function showResult(shortCode, originalURL) {
const shortURL = `linkmaker.in/#/${shortCode}`;
    const fullShortURL = `https://${shortURL}`;

shortLinkDisplay.textContent = shortURL;
originalUrlText.textContent = originalURL;

    // Generate QR code for the ORIGINAL long URL
    // Generate QR code DIRECTLY for the original long URL
generateQRCode(originalURL);

// Show result card with animation
@@ -378,6 +205,8 @@ function animateCounter(element, start, end) {
}, 16);
}



/**
* Save dashboard data to localStorage
*/
@@ -581,10 +410,8 @@ function loadLinksHistory() {
async function handleShortenURL() {
const url = urlInput.value.trim();

    // Hide any previous errors and results
hideError();

    // Validate URL
if (!url) {
showError('Please enter a URL');
return;
@@ -595,44 +422,37 @@ async function handleShortenURL() {
return;
}

    // Normalize URL
const normalizedURL = normalizeURL(url);

    // Show loading state
shortenBtn.disabled = true;
btnText.classList.add('hidden');
btnArrow.classList.add('hidden');
btnLoader.classList.remove('hidden');

    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate short code
const shortCode = generateShortCode();

    // Store mapping
    // Save to Map
urlDatabase.set(shortCode, normalizedURL);

    // Add to history table
    addLinkToHistory(shortCode, normalizedURL);
    
    // Save to localStorage for persistence
    // Save to persistent storage immediately
saveToLocalStorage();

    // Update dashboard
    // Add to history and update UI
    addLinkToHistory(shortCode, normalizedURL);
    
dashboardData.todayLinks++;
updateDashboard();

    // Show result
    // Display result
showResult(shortCode, normalizedURL);

    // Reset button state
shortenBtn.disabled = false;
btnText.classList.remove('hidden');
btnArrow.classList.remove('hidden');
btnLoader.classList.add('hidden');

    // Clear input
urlInput.value = '';
}

@@ -686,13 +506,13 @@ async function handleCopyLink() {
}

/**
 * Generates a QR code for the shortened link
 * Generates a QR code for the original link
* @param {string} text - The text to encode in the QR code
*/
function generateQRCode(text) {
const qrContainer = document.getElementById('qrCode');

    // Uses the original long URL for the QR code for instant cross-device scannability
    // Use the original long URL for the QR code
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}&margin=10`;

qrContainer.innerHTML = `
@@ -704,13 +524,11 @@ function generateQRCode(text) {
* Handles QR code button click - downloads the QR code
*/
function handleQRClick() {
    // Get the original URL from the display element
const originalURL = originalUrlText.textContent;

// Use the original long URL for the download too
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(originalURL)}&margin=10`;

    // Create a temporary link and trigger download
const link = document.createElement('a');
link.href = qrApiUrl;
link.download = `qr-code-original.png`;
@@ -791,10 +609,12 @@ function handleRedirect(shortCode) {
updateDashboard();
}

        // Direct redirection
        window.location.href = originalURL;
    } else {
        alert('Short link not found!');
        // Direct redirection with absolute priority
        console.log('Redirecting to:', originalURL);
        
        // Force immediate navigation to original URL
        // We use replace to prevent the back-button loop
        window.location.replace(originalURL);
}
}

@@ -803,22 +623,49 @@ function handleRedirect(shortCode) {
* Optimized for /#/abc123 format
*/
function checkForRedirect() {
    // Check hash for short code (e.g., #/abc123)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
        const shortCode = hash.substring(2);
        if (urlDatabase.has(shortCode)) {
            handleRedirect(shortCode);
            return;
        }
    }
    let hash = window.location.hash;
    
    if (hash) {
        // Clean the code: remove all leading # and / characters
        const shortCode = hash.replace(/^[#/]+/, "");

    // Legacy support for ?short=abc123
    const urlParams = new URLSearchParams(window.location.search);
    const legacyShortCode = urlParams.get('short');
    if (legacyShortCode && urlDatabase.has(legacyShortCode)) {
        handleRedirect(legacyShortCode);
        if (shortCode && shortCode.length > 0) {
            // 1. Check in-memory database
            let destination = urlDatabase.get(shortCode);
            
            // 2. Check persistent history array
            if (!destination) {
                const history = JSON.parse(localStorage.getItem('linksHistory') || '[]');
                const found = history.find(l => l.shortCode === shortCode);
                if (found) destination = found.originalUrl;
            }

            // 3. Fallback: Check raw urlDatabase in localStorage
            if (!destination) {
                const savedDb = JSON.parse(localStorage.getItem('urlDatabase') || '[]');
                const foundInDb = savedDb.find(entry => entry[0] === shortCode);
                if (foundInDb) destination = foundInDb[1];
            }

            if (destination) {
                // FORCE REDIRECT: Ensure protocol exists
                if (!destination.match(/^https?:\/\//i)) {
                    destination = 'https://' + destination;
                }

                // Immediate hard redirect
                window.location.replace(destination);
                
                // Fallback for some mobile browsers
                setTimeout(() => {
                    window.location.href = destination;
                }, 50);
                
                return true;
            }
        }
}
    return false;
}

// ========================================
@@ -880,7 +727,9 @@ copyBtn.addEventListener('click', handleCopyLink);
qrBtn.addEventListener('click', handleQRClick);

// Mobile menu toggle
mobileMenuToggle.addEventListener('click', toggleMobileMenu);
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
}

// Get Started CTA scroll
const ctaShortenBtn = document.getElementById('ctaShortenBtn');
@@ -894,6 +743,8 @@ if (ctaShortenBtn) {
});
}

// Refresh functionality removed

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
if (mobileMenu.classList.contains('active') && 
@@ -959,11 +810,16 @@ function init() {
// Update dashboard with current data
updateDashboard();

    // Check for redirect parameters
    // Check for redirect parameters IMMEDIATELY
checkForRedirect();

    // Focus on input field
    urlInput.focus();
    // Also listen for hash changes if the user scans while already on the page
    window.addEventListener('hashchange', checkForRedirect);
    
    // If we are currently redirecting, don't focus or log (optional but cleaner)
    if (!window.location.hash) {
        urlInput.focus();
    }

console.log('LinkMaker initialized successfully!');
}
@@ -1007,15 +863,147 @@ function initCookieConsent() {
});
}



// Login Logic
function initLogin() {
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const closeModal = document.getElementById('closeModal');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const navUserArea = document.getElementById('navUserArea');
    const mobileUserArea = document.getElementById('mobileUserArea');

    function updateUIForLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            let userName = localStorage.getItem('userDisplayName') || 'Krushna Anil Kaminwar';
            // Shorten name for nav if too long
            const displayNavName = userName.length > 12 ? userName.substring(0, 10) + '...' : userName;
            const userInitial = userName.charAt(0).toUpperCase();

            if (navUserArea) {
                navUserArea.innerHTML = `
                    <div class="user-profile-nav" onclick="window.location.href='profile.html'">
                        <div class="user-avatar">${userInitial}</div>
                        <span class="user-name">${displayNavName}</span>
                    </div>
                `;
            }
            if (mobileUserArea) {
                mobileUserArea.innerHTML = `
                    <div class="mobile-user-profile">
                        <div class="user-avatar">${userInitial}</div>
                        <div style="display: flex; flex-direction: column;">
                            <span class="user-name" onclick="window.location.href='profile.html'">${userName}</span>
                            <a href="#" class="logout-link" id="logoutBtn" style="margin-left: 0; margin-top: 4px;">Logout</a>
                        </div>
                    </div>
                `;
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('isLoggedIn');
                        window.location.reload();
                    });
                }
            }
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginModal.classList.remove('hidden');
        });
    }

    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', () => {
            loginModal.classList.remove('hidden');
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            loginModal.classList.add('hidden');
        });
    }

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            const emailInput = document.getElementById('loginEmailInput');
            const errorMsg = document.getElementById('loginError');
            
            let email = "";
            if (emailInput) {
                const inputVal = emailInput.value.trim();
                // Basic Gmail validation
                if (!inputVal || !inputVal.includes('@')) {
                    if (errorMsg) errorMsg.classList.remove('hidden');
                    return;
                }
                email = inputVal;
            }

            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);
            
            // Save join year only if it doesn't exist yet
            if (!localStorage.getItem('joinYear')) {
                localStorage.setItem('joinYear', new Date().getFullYear());
            }
            
            localStorage.setItem('cookieChoice', 'accepted');
            const cookieBanner = document.getElementById('cookieConsent');
            if (cookieBanner) cookieBanner.classList.add('hidden');
            
            loginModal.classList.add('hidden');
            updateUIForLogin();
            window.location.reload();
        });
    }

    if (!localStorage.getItem('isLoggedIn')) {
        setTimeout(() => {
            if (!localStorage.getItem('isLoggedIn') && loginModal) {
                loginModal.classList.remove('hidden');
            }
        }, 1500);
    }

    updateUIForLogin();
    
    // Check if on about page and update user info
    if (window.location.pathname.includes('about.html')) {
        const userInfoDisplay = document.getElementById('userInfoDisplay');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn && userInfoDisplay) {
            userInfoDisplay.classList.remove('hidden');
        }
    }

    // Ensure Logo link works everywhere
    const navLogo = document.getElementById('navLogo');
    if (navLogo) {
        navLogo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
init();
initCookieConsent();
        initLogin();
});
} else {
init();
initCookieConsent();
    initLogin();
}

// ========================================
