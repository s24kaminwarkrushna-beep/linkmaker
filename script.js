import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      email: user.email,
      photo: user.photoURL,
      lastLogin: new Date()
    });

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userDisplayName", user.displayName || "User");

    const loginModal = document.getElementById("loginModal");
    if (loginModal) loginModal.classList.add("hidden");

    updateUIForLogin();
  } catch (err) {
    console.error("❌ Login failed", err);
    alert("Google login failed. Please check your console for details.");
  }
});

// ========================================
// AUTH STATE HANDLER
// ========================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userDisplayName", user.displayName || "User");
    updateUIForLogin();
  } else {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userDisplayName");

    const navUserArea = document.getElementById("navUserArea");
    const mobileUserArea = document.getElementById("mobileUserArea");

    if (navUserArea) {
      navUserArea.innerHTML = `
        <button class="btn-login" id="loginBtn">Login</button>
      `;
    }

    if (mobileUserArea) {
      mobileUserArea.innerHTML = `
        <button class="btn-login mobile" id="mobileLoginBtn">Login</button>
      `;
    }

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
    navUserArea.innerHTML = `<div class="user-profile-nav" onclick="window.location.href='profile.html'"> <div class="user-avatar">${initial}</div> <span class="user-name">${displayNavName}</span> </div>`;
  }

  if (mobileUserArea) {
    mobileUserArea.innerHTML = `<div class="mobile-user-profile"> <div class="user-avatar">${initial}</div> <div style="display: flex; flex-direction: column;"> <span class="user-name" onclick="window.location.href='profile.html'">${name}</span> <a href="#" onclick="logoutUser()" style="margin-left: 0; margin-top: 4px;">Logout</a> </div> </div>`;
  }
}

// ========================================
// DASHBOARD DATA
// ========================================
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
  if (!string) return false;

  // Add protocol if missing
  let testString = string;
  if (!testString.match(/^https?:\/\//i)) {
    testString = 'http://' + testString;
  }

  try {
    const url = new URL(testString);
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    // Must have a valid hostname with at least one dot
    if (!url.hostname || !url.hostname.includes('.')) {
      return false;
    }
    // Hostname must have valid TLD (at least 2 chars after last dot)
    const parts = url.hostname.split('.');
    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      return false;
    }
    return true;
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
  setTimeout(() => { hideError(); }, 4000);
}

function hideError() {
  errorMessage.classList.add('hidden');
}

function showResult(shortCode, originalURL) {
  const shortURL = `https://linkmaker.in/${shortCode}`;
  shortLinkDisplay.textContent = shortURL;

  // Truncate display of original URL if it's very long to prevent UI freeze
  if (originalURL.length > 200) {
    originalUrlText.textContent = originalURL.substring(0, 200) + '...';
  } else {
    originalUrlText.textContent = originalURL;
  }
  originalUrlText.title = originalURL;

  // Generate QR code using the SHORT link (not the original long URL)
  generateQRCode(`https://linkmaker.in/${shortCode}`);
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
    if ((inc > 0 && current >= end) || (inc < 0 && current <= end)) {
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
      if (diffMinutes === 0) return 'Just now';
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

// Helper to safely escape HTML to prevent XSS and rendering issues with long URLs
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// Helper to truncate a URL string for display
function truncateURL(url, maxLen) {
  if (url.length <= maxLen) return escapeHTML(url);
  return escapeHTML(url.substring(0, maxLen)) + '...';
}

function renderLinksTable() {
  const tableBody = document.getElementById('linksTableBody');

  if (linksHistory.length === 0) {
    tableBody.innerHTML = `<tr class="empty-state">
            <td colspan="4">
                <div class="empty-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>
                    <p>No links shortened yet</p>
                    <span>Start by shortening your first link above</span>
                </div>
            </td>
        </tr>`;
    return;
  }

  const sortedLinks = [...linksHistory].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Build table rows using DOM methods to avoid innerHTML issues with very long URLs
  tableBody.innerHTML = '';

  sortedLinks.forEach((link, index) => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-index', index);

    // Original URL cell
    const tdOriginal = document.createElement('td');
    tdOriginal.className = 'original-url-cell';
    tdOriginal.title = link.originalUrl;
    tdOriginal.textContent = link.originalUrl.length > 60
      ? link.originalUrl.substring(0, 60) + '...'
      : link.originalUrl;
    tr.appendChild(tdOriginal);

    // Short URL cell
    const tdShort = document.createElement('td');
    tdShort.className = 'short-url-cell';
    tdShort.textContent = `linkmaker.in/${link.shortCode}`;
    tr.appendChild(tdShort);

    // Date cell
    const tdDate = document.createElement('td');
    tdDate.className = 'date-cell';
    tdDate.textContent = formatDate(link.createdAt);
    tr.appendChild(tdDate);

    // Actions cell
    const tdActions = document.createElement('td');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions-cell';

    const copyButton = document.createElement('button');
    copyButton.className = 'btn-table-copy';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', async () => {
      const url = `https://linkmaker.in/${link.shortCode}`;
      try {
        await navigator.clipboard.writeText(url);
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.textContent = 'Copy';
          copyButton.classList.remove('copied');
        }, 2000);
      } catch (err) {
        // Fallback copy
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          copyButton.textContent = 'Copied!';
          copyButton.classList.add('copied');
          setTimeout(() => {
            copyButton.textContent = 'Copy';
            copyButton.classList.remove('copied');
          }, 2000);
        } catch (e) {
          console.error('Copy failed', e);
        }
        document.body.removeChild(textArea);
      }
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-table-delete';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteLink(link.shortCode);
    });

    actionsDiv.appendChild(copyButton);
    actionsDiv.appendChild(deleteButton);
    tdActions.appendChild(actionsDiv);
    tr.appendChild(tdActions);

    tableBody.appendChild(tr);
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
let isShortening = false;

async function handleShortenURL() {
  // Prevent double-clicks / multiple simultaneous requests
  if (isShortening) return;

  const url = urlInput.value.trim();
  hideError();

  if (!url) {
    showError('Please enter a URL');
    return;
  }

  // Check URL length limit (Firestore document field max ~1MB, but let's be practical)
  if (url.length > 50000) {
    showError('URL is too long. Maximum 50,000 characters allowed.');
    return;
  }

  if (!isValidURL(url)) {
    showError('Please enter a valid URL (e.g., https://example.com)');
    return;
  }

  const normalizedURL = normalizeURL(url);

  isShortening = true;
  shortenBtn.disabled = true;
  btnText.classList.add('hidden');
  btnArrow.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  try {
    // Small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 500));

    const shortCode = generateShortCode();

    await setDoc(doc(db, "links", shortCode), {
      originalUrl: normalizedURL,
      createdAt: serverTimestamp(),
      clicks: 0,
      uid: auth.currentUser ? auth.currentUser.uid : null
    });

    console.log("✅ Link saved to Firestore:", shortCode);

    addLinkToHistory(shortCode, normalizedURL);

    dashboardData.todayLinks++;
    updateDashboard();

    showResult(shortCode, normalizedURL);

    urlInput.value = '';
  } catch (err) {
    console.error("❌ Failed to shorten URL:", err);
    showError('Failed to create short link. Please try again.');
  } finally {
    isShortening = false;
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
    const originalTextContent = copyBtn.querySelector('.copy-text').textContent;
    copyBtn.querySelector('.copy-text').textContent = 'Copied!';
    copySuccess.classList.remove('hidden');

    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.querySelector('.copy-text').textContent = originalTextContent;
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

  // Use the short URL for QR code generation (always short, never freezes)
  // Limit QR text length just in case
  let qrText = text;
  if (qrText.length > 2000) {
    qrText = qrText.substring(0, 2000);
  }

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrText)}&margin=10`;

  // Use DOM methods instead of innerHTML for safety
  const img = document.createElement('img');
  img.src = qrApiUrl;
  img.alt = 'QR Code';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.borderRadius = '8px';

  // Handle image load errors gracefully
  img.onerror = () => {
    qrContainer.innerHTML = '<p style="padding:20px;font-size:12px;color:#94a3b8;">QR code unavailable</p>';
  };

  qrContainer.innerHTML = '';
  qrContainer.appendChild(img);
}

function handleQRClick() {
  // Download QR for the SHORT link (not the original long URL)
  const shortURL = shortLinkDisplay.textContent;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shortURL)}&margin=10`;

  const link = document.createElement('a');
  link.href = qrApiUrl;
  link.download = `qr-code-linkmaker.png`;
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
// SMOOTH SCROLLING
// ========================================
function handleNavigation() {
  document.querySelectorAll('a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  if (e.key === 'Enter') handleShortenURL();
});

urlInput.addEventListener('focus', () => { hideError(); });

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
  setupLoginModalListeners();
  handleNavigation();
  initScrollAnimations();
  renderLinksTable();
  updateDashboard();
  urlInput.focus();
  console.log('LinkMaker initialized successfully!');
}

// ========================================
// COOKIE CONSENT
// ========================================
function initCookieConsent() {
  const banner = document.getElementById('cookieConsent');
  const acceptBtn = document.getElementById('acceptCookies');
  const rejectBtn = document.getElementById('rejectCookies');

  if (!localStorage.getItem('cookieChoice')) {
    setTimeout(() => { banner.classList.remove('hidden'); }, 1500);
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

// ========================================
// START APPLICATION
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initCookieConsent();
  });
} else {
  init();
  initCookieConsent();
}
