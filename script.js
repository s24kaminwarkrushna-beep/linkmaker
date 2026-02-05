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
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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
    // User is signed in
localStorage.setItem("isLoggedIn", "true");
localStorage.setItem("userDisplayName", user.displayName || "User");
updateUIForLogin();
} else {
    // User is signed out
localStorage.removeItem("isLoggedIn");
localStorage.removeItem("userDisplayName");
    // Also clear any UI specific to logged in state
    const navUserArea = document.getElementById("navUserArea");
    const mobileUserArea = document.getElementById("mobileUserArea");
    if (navUserArea) navUserArea.innerHTML = '';
    if (mobileUserArea) mobileUserArea.innerHTML = '';

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

/**
* Validates if the provided string is a valid URL
* @param {string} string - The URL string to validate
* @returns {boolean} - True if valid URL, false otherwise
*/
function isValidURL(string) {
// Remove leading/trailing whitespace
string = string.trim();

// Check if empty
if (!string) {
return false;
}

// Add protocol if missing
if (!string.match(/^https?:\/\//i)) {
string = 'http://' + string;
}

// URL validation pattern
const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

try {
const url = new URL(string);
return urlPattern.test(string) && (url.protocol === 'http:' || url.protocol === 'https:');
} catch (e) {
return false;
}
}

/**
* Normalizes URL by ensuring it has a protocol
* @param {string} url - The URL to normalize
* @returns {string} - Normalized URL with protocol
*/
function normalizeURL(url) {
url = url.trim();
if (!url.match(/^https?:\/\//i)) {
return 'http://' + url;
}
return url;
}

/**
* Generates a random short code for the shortened URL
* @param {number} length - Length of the short code
* @returns {string} - Random alphanumeric code
*/
function generateShortCode(length = 6) {
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let result = '';

for (let i = 0; i < length; i++) {
result += characters.charAt(Math.floor(Math.random() * characters.length));
}

// Check if code already exists, regenerate if it does
if (urlDatabase.has(result)) {
return generateShortCode(length);
}

return result;
}

/**
* Shows error message with custom text
* @param {string} message - Error message to display
*/
function showError(message) {
errorText.textContent = message;
errorMessage.classList.remove('hidden');

// Auto-hide after 4 seconds
setTimeout(() => {
hideError();
}, 4000);
}

/**
* Hides error message
*/
function hideError() {
errorMessage.classList.add('hidden');
}

/**
* Shows the result card with the shortened link
* @param {string} shortCode - The generated short code
* @param {string} originalURL - The original long URL
*/
function showResult(shortCode, originalURL) {
const shortURL = `linkmaker.in/#/${shortCode}`;
const fullShortURL = `https://${shortURL}`;

shortLinkDisplay.textContent = shortURL;
originalUrlText.textContent = originalURL;

// Generate QR code for the ORIGINAL long URL
generateQRCode(originalURL);

// Show result card with animation
resultCard.classList.remove('hidden');

// Scroll to result
setTimeout(() => {
resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}, 100);
}

/**
* Hides the result card
*/
function hideResult() {
resultCard.classList.add('hidden');
copySuccess.classList.add('hidden');
}

/**
* Updates the dashboard statistics
*/
function updateDashboard() {
// Update total links
dashboardData.totalLinks = urlDatabase.size;

// Check if it's a new day
const today = new Date().toDateString();
if (dashboardData.lastUpdate !== today) {
dashboardData.todayLinks = 0;
dashboardData.lastUpdate = today;
}

// Calculate actual total clicks from links history
dashboardData.totalClicks = linksHistory.reduce((sum, link) => sum + (link.clicks || 0), 0);

// Update DOM
animateCounter(totalLinksEl, parseInt(totalLinksEl.textContent) || 0, dashboardData.totalLinks);
animateCounter(totalClicksEl, parseInt(totalClicksEl.textContent) || 0, dashboardData.totalClicks);
animateCounter(activeLinksEl, parseInt(activeLinksEl.textContent) || 0, dashboardData.totalLinks);

linkChangeEl.textContent = `+${dashboardData.todayLinks} today`;

// Save to localStorage
saveDashboardData();
}

/**
* Animates counter from start to end
*/
function animateCounter(element, start, end) {
const duration = 1000;
const range = end - start;
const increment = range / (duration / 16);
let current = start;

const timer = setInterval(() => {
current += increment;
if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
current = end;
clearInterval(timer);
}
element.textContent = Math.floor(current).toLocaleString();
}, 16);
}

/**
* Save dashboard data to localStorage
*/
function saveDashboardData() {
try {
localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
} catch (e) {
console.log('Could not save dashboard data');
}
}

/**
* Load dashboard data from localStorage
*/
function loadDashboardData() {
try {
const saved = localStorage.getItem('dashboardData');
if (saved) {
dashboardData = JSON.parse(saved);

// Check if it's a new day
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

/**
* Formats a date to a readable string
*/
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

/**
* Renders the links table
*/
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

// Sort by date (newest first)
const sortedLinks = [...linksHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

tableBody.innerHTML = sortedLinks.map((link, index) => `
       <tr data-index="${index}">
           <td class="original-url-cell" title="${link.originalUrl}">${link.originalUrl}</td>
           <td class="short-url-cell">linkmaker.in/#/${link.shortCode}</td>
           <td class="date-cell">${formatDate(link.createdAt)}</td>
           <td>
               <div class="actions-cell">
                   <button class="btn-table-copy" data-url="https://linkmaker.in/#/${link.shortCode}">
                       Copy
                   </button>
                   <button class="btn-table-delete" data-code="${link.shortCode}">
                       Delete
                   </button>
               </div>
           </td>
       </tr>
   `).join('');

// Add event listeners to copy buttons
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

// Add event listeners to delete buttons
tableBody.querySelectorAll('.btn-table-delete').forEach(btn => {
btn.addEventListener('click', (e) => {
const shortCode = e.target.getAttribute('data-code');
deleteLink(shortCode);
});
});
}

/**
* Adds a new link to the history
*/
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

/**
* Deletes a link from history
*/
function deleteLink(shortCode) {
const index = linksHistory.findIndex(link => link.shortCode === shortCode);
if (index > -1) {
linksHistory.splice(index, 1);
urlDatabase.delete(shortCode);
saveLinksHistory();
saveToLocalStorage();
renderLinksTable();
updateDashboard();
}
}

/**
* Save links history to localStorage
*/
function saveLinksHistory() {
try {
localStorage.setItem('linksHistory', JSON.stringify(linksHistory));
} catch (e) {
console.log('Could not save links history');
}
}

/**
* Load links history from localStorage
*/
function loadLinksHistory() {
try {
const saved = localStorage.getItem('linksHistory');
if (saved) {
const history = JSON.parse(saved);
linksHistory.push(...history);

// Restore urlDatabase from history
history.forEach(link => {
urlDatabase.set(link.shortCode, link.originalUrl);
});
}
} catch (e) {
console.log('Could not load links history');
}
}

// ========================================
// EVENT HANDLERS
// ========================================

/**
* Handles the URL shortening process
*/
async function handleShortenURL() {
const url = urlInput.value.trim();

// Hide any previous errors and results
hideError();

// Validate URL
if (!url) {
showError('Please enter a URL');
return;
}

if (!isValidURL(url)) {
showError('Please enter a valid URL (e.g., https://example.com)');
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

// Generate short code
const shortCode = generateShortCode();

// Store mapping
urlDatabase.set(shortCode, normalizedURL);

// Add to history table
addLinkToHistory(shortCode, normalizedURL);

// Save to localStorage for persistence
saveToLocalStorage();

// Update dashboard
dashboardData.todayLinks++;
updateDashboard();

// Show result
showResult(shortCode, normalizedURL);

// Reset button state
shortenBtn.disabled = false;
btnText.classList.remove('hidden');
btnArrow.classList.remove('hidden');
btnLoader.classList.add('hidden');

// Clear input
urlInput.value = '';
}

/**
* Handles copying the shortened link to clipboard
*/
async function handleCopyLink() {
const shortURL = 'https://' + shortLinkDisplay.textContent;

try {
// Use Clipboard API
await navigator.clipboard.writeText(shortURL);

// Show success feedback
copyBtn.classList.add('copied');
const originalText = copyBtn.querySelector('.copy-text').textContent;
copyBtn.querySelector('.copy-text').textContent = 'Copied!';
copySuccess.classList.remove('hidden');

// Reset after 2 seconds
setTimeout(() => {
copyBtn.classList.remove('copied');
copyBtn.querySelector('.copy-text').textContent = originalText;
copySuccess.classList.add('hidden');
}, 2000);

} catch (err) {
// Fallback for older browsers
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

/**
* Generates a QR code for the shortened link
* @param {string} text - The text to encode in the QR code
*/
function generateQRCode(text) {
const qrContainer = document.getElementById('qrCode');

// Uses the original long URL for the QR code for instant cross-device scannability
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}&margin=10`;

qrContainer.innerHTML = `
       <img src="${qrApiUrl}" alt="QR Code" style="width: 100%; height: 100%; border-radius: 8px;" />
   `;
}

/**
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
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

/**
* Toggles mobile menu
*/
function toggleMobileMenu() {
mobileMenu.classList.toggle('active');

// Animate hamburger menu
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
// LOCAL STORAGE FUNCTIONS
// ========================================

/**
* Save data to localStorage for persistence
*/
function saveToLocalStorage() {
try {
localStorage.setItem('urlDatabase', JSON.stringify(Array.from(urlDatabase.entries())));
} catch (e) {
console.log('LocalStorage not available');
}
}

/**
* Load data from localStorage
*/
function loadFromLocalStorage() {
try {
const savedDatabase = localStorage.getItem('urlDatabase');

if (savedDatabase) {
const entries = JSON.parse(savedDatabase);
entries.forEach(([key, value]) => {
urlDatabase.set(key, value);
});
}
} catch (e) {
console.log('Could not load from localStorage');
}
}

// ========================================
// REDIRECT SIMULATION
// ========================================

/**
* Simulates link redirection
* @param {string} shortCode - The short code to redirect
*/
function handleRedirect(shortCode) {
const originalURL = urlDatabase.get(shortCode);

if (originalURL) {
// Track the click in history
const linkIndex = linksHistory.findIndex(l => l.shortCode === shortCode);
if (linkIndex !== -1) {
linksHistory[linkIndex].clicks = (linksHistory[linkIndex].clicks || 0) + 1;
saveLinksHistory();
updateDashboard();
}

// Direct redirection
window.location.href = originalURL;
} else {
alert('Short link not found!');
}
}

/**
* Checks if the current URL contains a short code and simulates redirect
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

// Legacy support for ?short=abc123
const urlParams = new URLSearchParams(window.location.search);
const legacyShortCode = urlParams.get('short');
if (legacyShortCode && urlDatabase.has(legacyShortCode)) {
handleRedirect(legacyShortCode);
}
}

// ========================================
// SMOOTH SCROLLING FOR NAVIGATION
// ========================================

/**
* Handles smooth scrolling for navigation links
*/
function handleNavigation() {
document.querySelectorAll('a').forEach(anchor => {
anchor.addEventListener('click', function (e) {
const href = this.getAttribute('href');

// If it's an internal hash link on the same page
if (href && href.startsWith('#')) {
const target = document.querySelector(href);
if (target) {
e.preventDefault();
target.scrollIntoView({
behavior: 'smooth',
block: 'start'
});
}

// Close mobile menu if open
if (mobileMenu.classList.contains('active')) {
toggleMobileMenu();
}
}
// External links or separate pages (like about.html) will behave normally
});
});
}

// ========================================
// EVENT LISTENERS
// ========================================

// Shorten button click
shortenBtn.addEventListener('click', handleShortenURL);

// Enter key in input field
urlInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
handleShortenURL();
}
});

// Input field focus - hide error
urlInput.addEventListener('focus', () => {
hideError();
});

// Copy button click
copyBtn.addEventListener('click', handleCopyLink);

// QR button click
qrBtn.addEventListener('click', handleQRClick);

// Mobile menu toggle
mobileMenuToggle.addEventListener('click', toggleMobileMenu);

// Get Started CTA scroll
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

// Close mobile menu when clicking outside
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

/**
* Adds scroll-triggered animations
*/
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

// Observe feature cards
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

/**
* Initialize the application
*/
function init() {
// Load saved data from localStorage
loadFromLocalStorage();
loadDashboardData();
loadLinksHistory();

// Setup navigation
handleNavigation();

// Initialize scroll animations
initScrollAnimations();

// Render links table
renderLinksTable();

// Update dashboard with current data
updateDashboard();

// Check for redirect parameters
checkForRedirect();

// Focus on input field
urlInput.focus();

console.log('LinkMaker initialized successfully!');
}

// ========================================
// START APPLICATION
// ========================================

// Cookie Consent Logic
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

// If user is already logged in, consider cookies accepted and hide banner
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
init();
initCookieConsent();
});
} else {
init();
initCookieConsent();
}

// ========================================
// DEMO FUNCTIONALITY
// ========================================

/**
* Add some demo data for testing (optional)
* Uncomment to pre-populate with sample links
*/
function addDemoData() {
// Example usage:
// urlDatabase.set('demo1', 'https://www.example.com/very/long/url/path');
// urlDatabase.set('demo2', 'https://github.com/user/repository');
// saveToLocalStorage();
}

// Uncomment to add demo data
// addDemoData();
