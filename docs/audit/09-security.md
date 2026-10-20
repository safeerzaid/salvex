# 09 - SECURITY AND VULNERABILITY AUDIT

**Audited Target:** Entire codebase (`src/`, `package.json`, `index.html`)  
**Auditor:** Senior Staff Engineer & Security Reviewer

---

## 1. Secrets & Credentials Scan

```
Grep Query: api_key|secret|password|private_key|token|bearer
Findings: 
- src/components/LoginPage.jsx:26: password = '••••••••••••' (hardcoded dummy UI display string)
- src/data/mockVehicles.js: Dummy placeholder phone numbers ("+91 00000 00000") and demo emails ("demo.bidder@example.com")
```

### Verdict:
**No active production secrets, private keys, AWS tokens, or database passwords were detected in the repository or git history.** All credentials present are dummy values used for demo personas.

---

## 2. Security Vulnerability Assessment

### Vulnerability 1: Zero Access Control on Admin and Protected Views
- **Location:** `src/App.jsx:461-468` and `src/components/AdminPanel.jsx`
- **Severity:** **CRITICAL (If deployed as-is)**
- **Finding:** The application provides no authentication checks, route guards, or session tokens. Anyone can render the administrative console (`currentRoute = 'admin'`) and trigger destructive operations like approving/rejecting KYC documents or extending auctions.
- **Remediation:** Implement standard JSON Web Tokens (JWT) stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies, accompanied by an `AuthGuard` component that checks claims (`role: 'admin'`) before mounting administrative routes.

### Vulnerability 2: Absence of Input Sanitization & XSS Vector Review
- **Location:** `src/components/SearchPanel.jsx`, `src/components/ListVehiclePage.jsx`
- **Severity:** **MEDIUM**
- **Finding:** Currently, React's JSX automatic string escaping protects against direct reflected XSS in text nodes. However, search parameters and vehicle descriptions are not sanitized with a dedicated library like DOMPurify. If user-generated descriptions or vehicle names are ever rendered using `dangerouslySetInnerHTML`, the application becomes immediately vulnerable to stored XSS.
- **Remediation:** Enforce strict input validation using Zod or Yup schemas on all incoming strings and prohibit `dangerouslySetInnerHTML`.

### Vulnerability 3: Supply Chain Risk from Malicious / Accidental Package
- **Location:** `package.json:14` (`"i": "^0.3.7"`)
- **Severity:** **MEDIUM**
- **Finding:** The package `i` is an obscure utility library accidentally installed via CLI typo (`npm i i <package>`). Unmaintained, single-letter or typo-squatted npm packages are a common vector for supply-chain malware and cryptominers.
- **Remediation:** Immediately run `npm uninstall i` to remove the package from `package.json` and `package-lock.json`.

### Vulnerability 4: Missing Content Security Policy (CSP) & Security Headers
- **Location:** `index.html`, `vite.config.js`
- **Severity:** **MEDIUM**
- **Finding:** `index.html` contains no Content Security Policy `<meta>` tag, and Vite does not configure security response headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).
- **Remediation:** Add standard CSP headers via reverse proxy (Nginx / Cloudflare) restricting script execution strictly to self and verified Google Fonts domains.

---

## 3. Financial & Auction Integrity Risks (For Backend Integration)

When a real backend is connected, the following client-side logic must NOT be trusted:
1. **Client-Side Bid Validation (`VehicleDetailsPage.jsx:129`):**
   The browser checks `bidAmount >= minNextBid`. In production, the backend server must re-validate the bid amount, ensure the auction has not expired, confirm the bidder has sufficient Earnest Money Deposit (EMD) balance, and execute the bid inside an ACID database transaction or distributed lock (Redis Redlock).
2. **Client-Side Invoice Calculations (`PaymentPage.jsx:32-37`):**
   The platform fee (2.5%), GST (18%), and EMD adjustments are computed in client JavaScript. The server must compute all invoices authoritatively; never allow the client to submit the payable balance.
