import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// ========================================
// FIREBASE SETUP
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
const db = getFirestore(app);


provider.setCustomParameters({
prompt: "select_account"
});

console.log("🔥 Firebase connected successfully");

// ========================================
// GLOBAL DATA
// ========================================
const linksHistory = [];

// ========================================
// DOM ELEMENTS (DECLARE EARLY)
// ========================================
const urlInput = document.getElementById('urlInput');
const shortenBtn = document.getElementById('shortenBtn');
const btnText = document.querySelector('.btn-text');
const btnArrow = document.querySelector('.btn-arrow');
const btnLoader = document.querySelector('.btn-loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const resultCard = document.getElementById('resultCard');
const shortLinkDisplay = document.getElementById('shortLinkDisplay');
const originalUrlText = document.getElementById('originalUrlText');
const copyBtn = document.getElementById('copyBtn');
const copySuccess = document.getElementById('copySuccess');
const qrBtn = document.getElementById('qrBtn');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');

// Dashboard Elements
const totalLinksEl = document.getElementById('totalLinks');
const totalClicksEl = document.getElementById('totalClicks');
const activeLinksEl = document.getElementById('activeLinks');
const linkChangeEl = document.getElementById('linkChange');

// ========================================
// LOGIN MODAL HANDLING
// ========================================
function setupLoginModalListeners() {
    const loginModal = document.getElementById("loginModal");
    const closeModal = document.getElementById("closeModal");

    const loginBtn = document.getElementById("loginBtn");
    const mobileLoginBtn = document.getElementById("mobileLoginBtn");

    loginBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔘 Login button clicked");
        if (loginModal) {
            loginModal.classList.remove("hidden");
            console.log("✅ Modal shown");
        }
    });

    mobileLoginBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🔘 Mobile login button clicked");
        if (loginModal) {
            loginModal.classList.remove("hidden");
        }
    });

    closeModal?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (loginModal) {
            loginModal.classList.add("hidden");
        }
    });

    // Close modal when clicking overlay background
    loginModal?.addEventListener("click", (e) => {
        if (e.target === loginModal) {
            loginModal.classList.add("hidden");
        }
    });
}

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
  // 🔥 SAVE USER TO FIRESTORE
await setDoc(doc(db, "users", user.uid), {
  name: user.displayName,
  email: user.email,
  photo: user.photoURL,
  lastLogin: new Date()
});


// Save to localStorage for persistence across page reloads
localStorage.setItem("isLoggedIn", "true");
localStorage.setItem("userDisplayName", user.displayName || "User");

// Close modal if open
const loginModal = document.getElementById("loginModal");
if (loginModal) loginModal.classList.add("hidden");

// Refresh UI
updateUIForLogin();

} catch (err) {
console.error("❌ Login failed", err);
alert("Google login failed. Please check your console for details.");
}
});

// ========================================
// AUTH STATE HANDLER (FIREBASE)
// ========================================
onAuthStateChanged(auth, (user) => {
if (user) {
    // User is signed in
localStorage.setItem("isLoggedIn", "true");
localStorage.setItem("userDisplayName", user.displayName || "User");
updateUIForLogin();
} else {
    // User is signed out
localStorage.removeItem("isLoggedIn");
localStorage.removeItem("userDisplayName");

    const navUserArea = document.getElementById("navUserArea");
    const mobileUserArea = document.getElementById("mobileUserArea");

    // 🔥 RESTORE LOGIN BUTTON (DESKTOP)
    if (navUserArea) {
      navUserArea.innerHTML = `
        <button class="btn-login" id="loginBtn">Login</button>
      `;
    }

    // 🔥 RESTORE LOGIN BUTTON (MOBILE)
    if (mobileUserArea) {
      mobileUserArea.innerHTML = `
        <button class="btn-login mobile" id="mobileLoginBtn">Login</button>
      `;
    }

    // ✅ Re-attach login modal listeners after DOM update
    setupLoginModalListeners();
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

// Dashboard Data
let dashboardData = {
totalLinks: 0,
totalClicks: 0,
todayLinks: 0,
lastUpdate: new Date().toDateString()
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

function isValidURL(string) {
string = string.trim();

if (!string) {
return false;
}

if (!string.match(/^https?:\/\//i)) {
string = 'http://' + string;
}

const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

try {
const url = new URL(string);
return urlPattern.test(string) && (url.protocol === 'http:' || url.protocol === 'https:');
} catch (e) {
return false;
}
}

function normalizeURL(url) {
url = url.trim();
if (!url.match(/^https?:\/\//i)) {
return 'http://' + url;
}
return url;
}

function generateShortCode(length = 6) {
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let result = '';

for (let i = 0; i < length; i++) {
result += characters.charAt(Math.floor(Math.random() * characters.length));
}

return result;
}

function showError(message) {
errorText.textContent = message;
errorMessage.classList.remove('hidden');

setTimeout(() => {
hideError();
}, 4000);
}

function hideError() {
errorMessage.classList.add('hidden');
}

// ✅ FIX: QR code now uses the ORIGINAL URL instead of short URL
function showResult(shortCode, originalURL) {
  const shortURL = `https://linkmaker.in/${shortCode}`;

  shortLinkDisplay.textContent = shortURL;
  originalUrlText.textContent = originalURL;

  generateQRCode(originalURL); // ✅ QR points to ORIGINAL link

  resultCard.classList.remove('hidden');

  setTimeout(() => {
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function hideResult() {
resultCard.classList.add('hidden');
copySuccess.classList.add('hidden');
}

function updateDashboard() {
dashboardData.totalLinks = linksHistory.length;

const today = new Date().toDateString();
if (dashboardData.lastUpdate !== today) {
dashboardData.todayLinks = 0;
dashboardData.lastUpdate = today;
}

dashboardData.totalClicks = linksHistory.reduce((sum, link) => sum + (link.clicks || 0), 0);

animateCounter(totalLinksEl, parseInt(totalLinksEl.textContent) || 0, dashboardData.totalLinks);
animateCounter(totalClicksEl, parseInt(totalClicksEl.textContent) || 0, dashboardData.totalClicks);
animateCounter(activeLinksEl, parseInt(activeLinksEl.textContent) || 0, dashboardData.totalLinks);

linkChangeEl.textContent = `+${dashboardData.todayLinks} today`;

saveDashboardData();
}

function animateCounter(element, start, end) {
  if (start === end) {
    element.textContent = end.toLocaleString();
    return;
  }

  const duration = 1000;
  const range = end - start;
  const inc = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += inc;

    if (
      (inc > 0 && current >= end) ||
      (inc < 0 && current <= end)
    ) {
      current = end;
      clearInterval(timer);
    }

    element.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

function saveDashboardData() {
try {
localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
} catch (e) {
console.log('Could not save dashboard data');
}
}

function loadDashboardData() {
try {
const saved = localStorage.getItem('dashboardData');
if (saved) {
dashboardData = JSON.parse(saved);

const today = new Date().toDateString();
if (dashboardData.lastUpdate !== today) {
dashboardData.todayLinks = 0;
dashboardData.lastUpdate = today;
}
}
} catch (e) {
console.log('Could not load dashboard data');
}
}

function formatDate(date) {
const now = new Date();
const linkDate = new Date(date);
const diffTime = Math.abs(now - linkDate);
const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

if (diffDays === 0) {
const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
if (diffHours === 0) {
const diffMinutes = Math.floor(diffTime / (1000 * 60));
if (diffMinutes === 0) {
return 'Just now';
}
return `${diffMinutes}m ago`;
}
return `${diffHours}h ago`;
} else if (diffDays === 1) {
return 'Yesterday';
} else if (diffDays < 7) {
return `${diffDays} days ago`;
} else {
return linkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
}

function renderLinksTable() {
const tableBody = document.getElementById('linksTableBody');

if (linksHistory.length === 0) {
tableBody.innerHTML = `
           <tr class="empty-state">
               <td colspan="4">
                   <div class="empty-message">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                       </svg>
                       <p>No links shortened yet</p>
                       <span>Start by shortening your first link above</span>
                   </div>
               </td>
           </tr>
       `;
return;
}

const sortedLinks = [...linksHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

tableBody.innerHTML = sortedLinks.map((link, index) => `
       <tr data-index="${index}">
           <td class="original-url-cell" title="${link.originalUrl}">${link.originalUrl}</td>
           <td class="short-url-cell">linkmaker.in/${link.shortCode}</td>
           <td class="date-cell">${formatDate(link.createdAt)}</td>
           <td>
               <div class="actions-cell">
                   <button class="btn-table-copy" data-url="https://linkmaker.in/${link.shortCode}">
                       Copy
                   </button>
                   <button class="btn-table-delete" data-code="${link.shortCode}">
                       Delete
                   </button>
               </div>
           </td>
       </tr>
   `).join('');

tableBody.querySelectorAll('.btn-table-copy').forEach(btn => {
btn.addEventListener('click', async (e) => {
const url = e.target.getAttribute('data-url');
try {
await navigator.clipboard.writeText(url);
e.target.textContent = 'Copied!';
e.target.classList.add('copied');
setTimeout(() => {
e.target.textContent = 'Copy';
e.target.classList.remove('copied');
}, 2000);
} catch (err) {
console.error('Copy failed', err);
}
});
});

tableBody.querySelectorAll('.btn-table-delete').forEach(btn => {
btn.addEventListener('click', (e) => {
const shortCode = e.target.getAttribute('data-code');
deleteLink(shortCode);
});
});
}

function addLinkToHistory(shortCode, originalUrl) {
const linkData = {
shortCode: shortCode,
originalUrl: originalUrl,
clicks: 0,
createdAt: new Date().toISOString()
};

linksHistory.push(linkData);
saveLinksHistory();
renderLinksTable();
}

function deleteLink(shortCode) {
const index = linksHistory.findIndex(link => link.shortCode === shortCode);
if (index > -1) {
linksHistory.splice(index, 1);
saveLinksHistory();
renderLinksTable();
updateDashboard();
}
}

function saveLinksHistory() {
try {
localStorage.setItem('linksHistory', JSON.stringify(linksHistory));
} catch (e) {
console.log('Could not save links history');
}
}

function loadLinksHistory() {
try {
const saved = localStorage.getItem('linksHistory');
if (saved) {
const history = JSON.parse(saved);
linksHistory.push(...history);
}
} catch (e) {
console.log('Could not load links history');
}
}

// ========================================
// EVENT HANDLERS
// ========================================

async function handleShortenURL() {
const url = urlInput.value.trim();

hideError();

if (!url) {
showError('Please enter a URL');
return;
}

if (!isValidURL(url)) {
showError('Please enter a valid URL (e.g., https://example.com)');
return;
}

const normalizedURL = normalizeURL(url);

// Show loading state
shortenBtn.disabled = true;
btnText.classList.add('hidden');
btnArrow.classList.add('hidden');
btnLoader.classList.remove('hidden');

try {
  // Simulate processing delay for better UX
  await new Promise(resolve => setTimeout(resolve, 800));

  // Generate short code
  const shortCode = generateShortCode();

  // 🔥 SAVE TO FIRESTORE (GLOBAL STORAGE)
  await setDoc(doc(db, "links", shortCode), {
    originalUrl: normalizedURL,
    createdAt: serverTimestamp(),
    clicks: 0,
    uid: auth.currentUser ? auth.currentUser.uid : null
  });

  console.log("✅ Link saved to Firestore:", shortCode);

  // UI-only history
  addLinkToHistory(shortCode, normalizedURL);

  // Update dashboard
  dashboardData.todayLinks++;
  updateDashboard();

  // Show result
  showResult(shortCode, normalizedURL);

  // Clear input
  urlInput.value = '';

} catch (err) {
  console.error("❌ Failed to shorten URL:", err);
  showError('Failed to create short link. Please try again.');
} finally {
  // ✅ ALWAYS reset button state
  shortenBtn.disabled = false;
  btnText.classList.remove('hidden');
  btnArrow.classList.remove('hidden');
  btnLoader.classList.add('hidden');
}
}

async function handleCopyLink() {
const shortURL = shortLinkDisplay.textContent;

try {
await navigator.clipboard.writeText(shortURL);

copyBtn.classList.add('copied');
const originalText = copyBtn.querySelector('.copy-text').textContent;
copyBtn.querySelector('.copy-text').textContent = 'Copied!';
copySuccess.classList.remove('hidden');

setTimeout(() => {
copyBtn.classList.remove('copied');
copyBtn.querySelector('.copy-text').textContent = originalText;
copySuccess.classList.add('hidden');
}, 2000);

} catch (err) {
const textArea = document.createElement('textarea');
textArea.value = shortURL;
textArea.style.position = 'fixed';
textArea.style.left = '-999999px';
document.body.appendChild(textArea);
textArea.select();

try {
document.execCommand('copy');
copyBtn.querySelector('.copy-text').textContent = 'Copied!';
copySuccess.classList.remove('hidden');

setTimeout(() => {
copyBtn.querySelector('.copy-text').textContent = 'Copy Link';
copySuccess.classList.add('hidden');
}, 2000);
} catch (e) {
console.error('Copy failed', e);
}

document.body.removeChild(textArea);
}
}

function generateQRCode(text) {
const qrContainer = document.getElementById('qrCode');

const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}&margin=10`;

qrContainer.innerHTML = `
       <img src="${qrApiUrl}" alt="QR Code" style="width: 100%; height: 100%; border-radius: 8px;" />
   `;
}

// ✅ FIX: QR download also uses the ORIGINAL URL
function handleQRClick() {
const originalURL = originalUrlText.textContent;

const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(originalURL)}&margin=10`;

const link = document.createElement('a');
link.href = qrApiUrl;
link.download = `qr-code-original.png`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

function toggleMobileMenu() {
mobileMenu.classList.toggle('active');

const spans = mobileMenuToggle.querySelectorAll('span');
if (mobileMenu.classList.contains('active')) {
spans[0].style.transform = 'rotate(45deg) translateY(8px)';
spans[1].style.opacity = '0';
spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
} else {
spans[0].style.transform = 'none';
spans[1].style.opacity = '1';
spans[2].style.transform = 'none';
}
}

// ========================================
// SMOOTH SCROLLING FOR NAVIGATION
// ========================================

function handleNavigation() {
document.querySelectorAll('a').forEach(anchor => {
anchor.addEventListener('click', function (e) {
const href = this.getAttribute('href');

if (href && href.startsWith('#')) {
const target = document.querySelector(href);
if (target) {
e.preventDefault();
target.scrollIntoView({
behavior: 'smooth',
block: 'start'
});
}

if (mobileMenu.classList.contains('active')) {
toggleMobileMenu();
}
}
});
});
}

// ========================================
// EVENT LISTENERS
// ========================================

shortenBtn.addEventListener('click', handleShortenURL);

urlInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
handleShortenURL();
}
});

urlInput.addEventListener('focus', () => {
hideError();
});

copyBtn.addEventListener('click', handleCopyLink);

qrBtn.addEventListener('click', handleQRClick);

mobileMenuToggle.addEventListener('click', toggleMobileMenu);

const ctaShortenBtn = document.getElementById('ctaShortenBtn');
if (ctaShortenBtn) {
ctaShortenBtn.addEventListener('click', () => {
const inputSection = document.querySelector('.input-section');
if (inputSection) {
inputSection.scrollIntoView({ behavior: 'smooth' });
urlInput.focus();
}
});
}

document.addEventListener('click', (e) => {
if (mobileMenu.classList.contains('active') && 
!mobileMenu.contains(e.target) && 
!mobileMenuToggle.contains(e.target)) {
toggleMobileMenu();
}
});

// ========================================
// SCROLL ANIMATIONS
// ========================================

function initScrollAnimations() {
const observerOptions = {
threshold: 0.1,
rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.style.opacity = '1';
entry.target.style.transform = 'translateY(0)';
}
});
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
card.style.opacity = '0';
card.style.transform = 'translateY(30px)';
card.style.transition = 'all 0.6s ease-out';
observer.observe(card);
});
}

// ========================================
// INITIALIZATION
// ========================================

function init() {
loadDashboardData();
loadLinksHistory();

// ✅ Setup login modal listeners on init
setupLoginModalListeners();

handleNavigation();
initScrollAnimations();
renderLinksTable();
updateDashboard();

urlInput.focus();

console.log('LinkMaker initialized successfully!');
}

// ========================================
// START APPLICATION
// ========================================

function initCookieConsent() {
const banner = document.getElementById('cookieConsent');
const acceptBtn = document.getElementById('acceptCookies');
const rejectBtn = document.getElementById('rejectCookies');

if (!localStorage.getItem('cookieChoice')) {
setTimeout(() => {
banner.classList.remove('hidden');
}, 1500);
}

acceptBtn.addEventListener('click', () => {
localStorage.setItem('cookieChoice', 'accepted');
banner.style.opacity = '0';
banner.style.transform = 'translateY(100px)';
banner.style.transition = 'all 0.5s ease';
setTimeout(() => banner.classList.add('hidden'), 500);
});

if (localStorage.getItem('isLoggedIn') === 'true') {
localStorage.setItem('cookieChoice', 'accepted');
banner.classList.add('hidden');
}

rejectBtn.addEventListener('click', () => {
localStorage.setItem('cookieChoice', 'rejected');
banner.style.opacity = '0';
banner.style.transform = 'translateY(100px)';
banner.style.transition = 'all 0.5s ease';
setTimeout(() => banner.classList.add('hidden'), 500);
});
}

async function firestoreRedirect() {
  const path = window.location.pathname;
  // ✅ FIX: Remove ALL leading slashes properly
  const shortCode = path.replace(/^\/+/, '').trim();

  // If homepage or empty, do nothing
  if (!shortCode || shortCode === '' || shortCode === 'index.html' || shortCode === 'about.html' || shortCode === 'privacy.html' || shortCode === 'terms.html' || shortCode === 'cookies.html' || shortCode === 'contact.html' || shortCode === 'profile.html') {
    console.log("📄 On a known page, skipping redirect check");
    return;
  }

  console.log("🔍 Checking redirect for:", shortCode);

  try {
    const linkRef = doc(db, "links", shortCode);
    const snap = await getDoc(linkRef);

    if (!snap.exists()) {
      console.log("❌ Short code not found in Firestore:", shortCode);
      // Don't destroy the page on homepage
      return;
    }

    const data = snap.data();

    // 🔥 Increment click count
    await updateDoc(linkRef, {
      clicks: increment(1)
    });

    console.log("🔁 Redirecting to:", data.originalUrl);
    // 🔁 Redirect
    window.location.replace(data.originalUrl);

  } catch (err) {
    console.error("Redirect failed", err);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
init();
firestoreRedirect();
initCookieConsent();
});
} else {
init();
firestoreRedirect();
initCookieConsent();
}
