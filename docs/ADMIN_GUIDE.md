# Salvex അഡ്മിൻ ഗൈഡ് (ക്ലയന്റിന്)

വെബ്സൈറ്റിൽ അഡ്മിൻ ആയി login ചെയ്ത് **Admin** തുറക്കുക. ഇടതുവശത്തെ മെനു:

| ഗ്രൂപ്പ് | ഭാഗങ്ങൾ |
|---|---|
| Enquiries | **Vehicle enquiries** (Ready to Lift), **Spare part enquiries**, Contact messages |
| Vehicles & auctions | **Auctions** (ടാബുകൾ: Waiting / Upcoming / Live / Ended), **Ready to Lift**, Results & fees |
| Buyers | KYC verification, Users |
| More | Spare parts catalogue, Reports, Audit log |

പുതിയ കാര്യങ്ങൾ ഉള്ള ഭാഗത്തിന് അടുത്ത് മഞ്ഞ നിറത്തിൽ എണ്ണം (ഉദാ: **3**) കാണിക്കും. ഫോണിലും കമ്പ്യൂട്ടറിലും ഒരുപോലെ ഉപയോഗിക്കാം.

## 0. Enquiries (എല്ലാ ദിവസവും ആദ്യം നോക്കേണ്ടത്)

* ആരെങ്കിലും Ready to Lift വാഹനത്തിൽ **I'm interested** അമർത്തുകയോ spare part ചോദിക്കുകയോ ചെയ്താൽ മുകളിലെ 🔔 bell-ൽ
  നോട്ടിഫിക്കേഷൻ വരും. അതിൽ click ചെയ്താൽ ആ enquiry നേരെ തുറക്കും.
* **Vehicle enquiries**: വാഹനം, buyer-ന്റെ പേര്, Buyer ID, ഫോൺ → **Call / WhatsApp / Email** → status **Contacted** / **Closed**, കുറിപ്പ്.
* **Spare part enquiries**: ഏത് part, ഏത് വാഹനം, ആര്, ഫോൺ → **Call / WhatsApp / Email** → status **Contacted** / **Closed**, കുറിപ്പ്.
  വിലയും ബാക്കി കാര്യങ്ങളും ഫോണിൽ പറയുക. വെബ്സൈറ്റിൽ നിന്ന് customer-ന് ഒന്നും പോകില്ല; കുറിപ്പ് admin-ന് മാത്രം കാണാം.
* പുതിയത് **New** ടാബിൽ. കൈകാര്യം ചെയ്ത് കഴിഞ്ഞാൽ status മാറ്റുക; അപ്പോൾ എണ്ണം കുറയും.

---

## 1. ഒരുപാട് വാഹനങ്ങൾ ഒരുമിച്ച് ചേർക്കാൻ (Bulk upload)

**ആദ്യം തയ്യാറാക്കേണ്ടത്:**
1. വാഹനങ്ങളുടെ Excel. നിങ്ങൾ ഇപ്പോൾ ഉപയോഗിക്കുന്ന 15 കോളങ്ങൾ മതി (Claim number, Registration number, Vehicle make,
   Model, Variant, Manufacturing year, Registration year, Fuel type, Transmission type, Number of owners,
   Vehicle damage type, Vehicle location, RC status, Registration type, Hypothecation status).
2. ഫോട്ടോകൾ: കമ്പ്യൂട്ടറിൽ ഒരു ഫോൾഡർ (ഉദാ: `Vandi Photos`). അതിനുള്ളിൽ ഓരോ വാഹനത്തിനും ഒരു ഫോൾഡർ,
   ഫോൾഡറിന്റെ പേര് **രജിസ്ട്രേഷൻ നമ്പർ** അല്ലെങ്കിൽ **ക്ലെയിം നമ്പർ**. ഫോട്ടോയുടെ പേര് മാറ്റേണ്ട.
   ```
   Vandi Photos/
     KL07AB1234/      ← ആ വാഹനത്തിന്റെ ഫോട്ടോകൾ
     CLM-2026-0002/   ← ക്ലെയിം നമ്പർ ആയാലും മതി
   ```

**ചെയ്യേണ്ടത്:**
1. ലേലത്തിനുള്ള വാഹനങ്ങൾ: Admin → **Auctions** → **Bulk upload** (കയറ്റിയ വാഹനങ്ങൾ **Waiting** ടാബിൽ വരും).
   Ready to Lift വാഹനങ്ങൾ: Admin → **Ready to Lift** → **Bulk upload** (അവിടെ കയറ്റുന്നതെല്ലാം Ready to Lift ആകും).
   ലളിതമായ വഴി: **വാഹനം കയറ്റുക → Waiting → Start auction → Upcoming → Live → Ended → Results & fees**.
2. **Auction category for rows without one**: Insurance / Bank-NBFC / Used vehicle തിരഞ്ഞെടുക്കുക.
3. **Choose Excel / CSV file** → നിങ്ങളുടെ Excel തിരഞ്ഞെടുക്കുക. ഓരോ വരിയും പരിശോധിക്കും:
   - പച്ച **OK** = ശരി.
   - ചുവപ്പ് = പ്രശ്നം, കാരണം അവിടെ തന്നെ എഴുതിയിരിക്കും. **Problem list** ഡൗൺലോഡ് ചെയ്ത് Excel-ൽ ശരിയാക്കി
     പിന്നീട് വീണ്ടും upload ചെയ്യാം. പ്രശ്നമുള്ള വരികൾ ഒഴിവാക്കി ബാക്കി കയറ്റാം.
4. **Choose photos folder** → `Vandi Photos` ഫോൾഡർ തിരഞ്ഞെടുക്കുക → ബ്രൗസർ ചോദിക്കുമ്പോൾ **Upload**.
   എത്ര വാഹനത്തിന് ഫോട്ടോ കിട്ടി എന്ന് കാണിക്കും.
5. **Import** അമർത്തുക. തീരുന്നത് വരെ window അടയ്ക്കരുത്.
   - ഫോട്ടോ ഉള്ള വാഹനങ്ങൾ വെബ്സൈറ്റിൽ വരും.
   - ഫോട്ടോ ഇല്ലാത്തവ താഴെ ലിസ്റ്റിൽ വരും: ഓരോന്നും തുറന്ന് ഫോട്ടോ ഇട്ട് **Publish** അമർത്തുക
     (പിന്നീട് അതേ ഭാഗത്തെ **Drafts** ടാബിൽ നിന്നും ചെയ്യാം).

**Optional കോളങ്ങൾ** (Excel-ൽ ചേർത്താൽ മാത്രം): Listing (Auction / Ready to Lift), KM driven, Superdari (Yes / No),
Auction category, Starting price, Auction start, Auction end (ഉദാ: `2026-10-28 10:00`).
Ready to Lift വാഹനത്തിന് Listing, KM driven, Superdari നിർബന്ധം. പുതിയ template: Bulk upload → **Excel template**.

## 2. പുതിയ വാഹനം, ഫോണിൽ നിന്ന് (യാർഡിൽ വെച്ച്)

1. ലേലത്തിനുള്ള വാഹനം: ഫോണിൽ വെബ്സൈറ്റ് → Admin → **Auctions** → **New auction** → വിവരങ്ങൾ → **Continue to photos**.
   Ready to Lift വാഹനം: Admin → **Ready to Lift** → **Add vehicle** → വിവരങ്ങൾ (KM driven, Superdari) → **Continue to photos**.
   (Excel വഴി കയറ്റിയ വാഹനമാണെങ്കിൽ: ആ ഭാഗത്തെ **Drafts** → വാഹനം തുറക്കുക.)
   Listing (Auction / Ready to Lift) തിരഞ്ഞെടുക്കേണ്ട: ഏത് ഭാഗത്ത് നിന്ന് ചേർക്കുന്നു എന്നത് വെച്ച് തനിയെ ആകും.
2. **Add photos** → ഫോണിൽ Camera (ഫോട്ടോ എടുക്കാൻ) അല്ലെങ്കിൽ Gallery (നേരത്തെ എടുത്തവ) തിരഞ്ഞെടുക്കുക. കമ്പ്യൂട്ടറിൽ ഫയൽ തിരഞ്ഞെടുക്കുകയോ വലിച്ചിടുകയോ ചെയ്യാം.
   ഓരോ ഫോട്ടോയും **ചതുരത്തിൽ (1:1) crop** ചെയ്യാൻ window വരും: ഫോട്ടോ വലിച്ച് നീക്കുക, zoom, Rotate → **Crop and use**.
   പല ഫോട്ടോ ഒരുമിച്ചാണെങ്കിൽ **Crop the rest from the centre** അമർത്തിയാൽ ബാക്കി തനിയെ നടുവിൽ നിന്ന് crop ആകും.
   ഇട്ട ഫോട്ടോ വീണ്ടും crop ചെയ്യാൻ ഫോട്ടോയുടെ താഴെ ✂ അമർത്തുക. Bulk upload-ലെ ഫോട്ടോകൾ തനിയെ നടുവിൽ നിന്ന് crop ആകും.
3. ആദ്യത്തെ ഫോട്ടോ ആണ് **Cover**. മാറ്റാൻ ഫോട്ടോയിലെ ⭐ അമർത്തുക; ◀ ▶ കൊണ്ട് ക്രമം മാറ്റാം.
4. **Publish vehicle** / **Confirm vehicle** → വെബ്സൈറ്റിൽ വരും.

**നല്ല ഫോട്ടോയ്ക്ക്:** ഫോൺ കുറുകെ പിടിക്കുക · വെളിച്ചമുള്ള സ്ഥലം · ആദ്യം മുൻവശം · പിന്നെ പിൻവശം, രണ്ടു വശങ്ങൾ,
കേടുപാട് (അടുത്ത്), ഉൾവശം, odometer · 6 മുതൽ 10 വരെ ഫോട്ടോ. ഫോട്ടോ തനിയെ ചെറുതാക്കും, location വിവരം മാറ്റും.

## 3. ലേലം (Auction)

* ഒരു വാഹനം: Auctions → **Waiting** → വാഹനത്തിന് നേരെ **Start auction**.
* പല വാഹനങ്ങൾ ഒരുമിച്ച്: Auctions → **Waiting** → **Start several together** → വാഹനങ്ങൾ tick ചെയ്യുക → ഓരോന്നിനും starting price
  (എല്ലാത്തിനും ഒരേ വിലയാണെങ്കിൽ **Same starting price** → Apply) → start, ആദ്യ end, **Gap** (ഉദാ: 2 മിനിറ്റ്,
  ലേലങ്ങൾ ഒന്നിനു പുറകെ ഒന്നായി തീരും) → **Create**.
* Upcoming / Live ടാബിൽ ലേലം തുറന്ന്: pause, resume, extend, cancel, close (കാരണം എഴുതണം).

## 4. ലേലം കഴിഞ്ഞ് (Results & fees → Deal & service fee)

1. Admin → **Results & fees** → വാഹനം തുറക്കുക: ജയിച്ച ആളിന്റെ പേര്, **Buyer ID**, ഫോൺ, ഇമെയിൽ.
2. വിളിച്ച് ഉടമയുമായി ബന്ധിപ്പിക്കുക (ഇടപാട് പുറത്ത്).
3. **Deal & service fee → Edit**: Approved amount, Approved date, Service fee.
4. ഫീ കിട്ടുമ്പോൾ **Add fee received**: തുക, തീയതി, reference (UPI / ചെക്ക് നമ്പർ). ഭാഗം ഭാഗമായും ചേർക്കാം.
   തെറ്റിയാൽ മൈനസ് തുക കൊണ്ട് തിരുത്താം (കാരണം എഴുതണം). Received / Pending തനിയെ കണക്കാക്കും.
5. ഇടപാട് കഴിഞ്ഞാൽ **Mark deal completed** അമർത്തുക. Buyer-ന്റെ dashboard-ൽ "Completed" എന്ന് കാണിക്കും.
6. ജയിച്ചയാൾ പിന്മാറിയാൽ **Cancel sale** (കാരണം എഴുതണം). വാഹനം **Auctions → Waiting**-ൽ തിരിച്ചു വരും, വീണ്ടും ലേലത്തിന് ഇടാം.

## 5. Ready to Lift

* Admin → **Ready to Lift** → **Add vehicle** (KM driven, Superdari നിർബന്ധം). ടാബുകൾ: Available / Sold / Drafts. വില വെബ്സൈറ്റിൽ കാണിക്കില്ല.
* ആരെങ്കിലും **I'm interested** അമർത്തിയാൽ നോട്ടിഫിക്കേഷൻ വരും → Admin → **Vehicle enquiries** →
  Call / WhatsApp / Email → status **Contacted** / **Closed**, കുറിപ്പ് എഴുതാം.
* വിറ്റാൽ: വാഹനം തുറക്കുക → **Mark as sold** (ലിസ്റ്റിൽ നിന്ന് മാറും). വീണ്ടും കാണിക്കാൻ **Show again**.

## 6. KYC

Admin → **KYC**: Aadhaar നമ്പർ (അവസാന 4 അക്കം മാത്രം കാണും), Aadhaar, PAN കോപ്പികൾ നോക്കി
**Approve** / **Request changes** / **Reject** (കാരണം എഴുതണം). ഒരേ Aadhaar മറ്റൊരു അക്കൗണ്ടിൽ ഉണ്ടെങ്കിൽ മുന്നറിയിപ്പ് കാണിക്കും.
KYC approve ആയവർക്ക് മാത്രം ബിഡ് ചെയ്യാം.

## 7. ആളെയും വാഹനത്തെയും കണ്ടുപിടിക്കാൻ (Search)

Admin-ന്റെ എല്ലാ സ്ക്രീനിലും മുകളിൽ ഒരു search box ഉണ്ട്:
* **Buyer ID** (`SLX-000123`, `slx123`, `123`), പേര്, ഫോൺ, ഇമെയിൽ → ആ ആളെ തുറക്കുക: ഫോൺ (Call / WhatsApp), KYC, എത്ര ബിഡ്,
  ജയിച്ച ലേലങ്ങൾ (വില, service fee കിട്ടിയത് / ബാക്കി), Ready to Lift / spare part enquiries.
* **രജിസ്ട്രേഷൻ നമ്പർ** (space ഉണ്ടെങ്കിലും മതി) അല്ലെങ്കിൽ **ക്ലെയിം നമ്പർ** → ആ വാഹനം തുറക്കുക: എല്ലാ വിവരങ്ങളും, ഫോട്ടോകൾ,
  ഓരോ ലേലവും (ജയിച്ചയാൾ, വില, fee), enquiries. ജയിച്ചയാളുടെ പേരിൽ click ചെയ്താൽ ആ ആളിലേക്ക് പോകും.
* Enter അമർത്തിയാൽ ആദ്യത്തെ result തുറക്കും.

## 8. മാസ റിപ്പോർട്ട്

Admin → **Reports** → മാസം തിരഞ്ഞെടുക്കുക → Payments / Vehicles / Buyers → **Download Excel**.
എല്ലാ മാസവും 1-ാം തീയതി ഓർമ്മിപ്പിക്കുന്ന നോട്ടിഫിക്കേഷൻ വരും.
