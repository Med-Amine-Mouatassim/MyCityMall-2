# MyCityMall

MyCityMall (MCM) is a browser based multi shop e commerce prototype. It brings together a customer facing mall explorer, seller tools, Firebase backed account and catalogue data, and a product discovery assistant.

> This repository reflects the code currently present. Some links and migration tools refer to files or pages that are not included, and the project does not contain an administrator dashboard or a complete checkout flow.

## Project Objectives

- Present multiple local shops in one online mall experience.
- Let visitors explore categories and search for products.
- Provide account and seller facing tools backed by Firebase services.
- Prepare a clear foundation for further development and a portfolio review.

## Main Features

- Account registration and sign in through Firebase Authentication, including email verification during registration.
- Mall exploration page with category navigation and profile controls.
- Favorites page that reads the signed in user's saved shops from Firestore.
- Product discovery assistant that searches Firestore products, supports text filters, and can read responses aloud where browser speech synthesis is available.
- Seller area for shop profile and appearance settings, product creation and removal, delivery details, product limits, and best seller selection.
- Help page with a complaint form linked to Formspree.
- Standalone HTML migration utilities for importing shop records into Firestore from category JSON files.

### Not Present or Not Verified

- No administrator dashboard was found.
- No complete cart, checkout, payment, or order creation flow was found. Some code displays a previously stored order.
- The product category pages linked from the explorer and the JSON files referenced by migration pages are not part of this repository.
- The login code currently routes users to the same explorer page after checking their profile document; role based navigation was not found there.

## User Roles

- **Customer:** can register and sign in, explore the available interface, view saved shops, and use the product assistant. The code reads user profile and favorites from Firestore.
- **Seller:** the seller page checks a `role` value of `vendeur` and uses a `shopId` profile field to load seller data. Seller tools operate on Firestore shop and product records.
- **Administrator:** no administrator interface or administration workflow was identified in the supplied files.

## Technologies Used

- HTML5, CSS, and browser JavaScript modules (no framework or build system detected).
- Firebase JavaScript SDK 10.7.1: Authentication and Cloud Firestore are used; Firebase Storage is initialized in the configuration but no Storage operations were found in the application code.
- Firebase App Check with a reCAPTCHA Enterprise provider on the explorer script.
- Cloudinary unsigned image uploads in the seller page.
- External CDN assets: Font Awesome, Google Fonts, Anime.js, and Compromise.
- Formspree for the complaint form.

## Project Architecture

```text
.
├── config/
│   └── firebase-config.js       # Firebase client initialization
├── docs/
│   └── PROJECT_AUDIT.md         # Audit notes and publication checklist
├── photos/                      # Existing image, video, QR, and presentation assets
├── logos/                       # Existing logo assets
├── scripts/
│   ├── auth.js                   # Registration and sign in handlers
│   ├── chatbot.js                # Standalone assistant implementation; currently not linked by a page
│   ├── indexjs.js                # Explorer behavior and Firebase integration
│   └── test.js                   # Unlinked legacy/experimental script; purpose needs confirmation
├── styles/
│   ├── explorer.css
│   └── indexstyle.css
├── aide.html
├── chatbot.html                  # Assistant page with its implementation embedded
├── explorer.html
├── favoris.html
├── login.html
├── migrate_*.html                # Firestore write utilities; see security notes
├── register.html
└── vendeur.html
```

HTML pages remain at the repository root to preserve their existing relative links. Some pages contain inline CSS or JavaScript; those blocks were left in place to avoid changing application behavior. `chatbot.html` contains its own assistant implementation while `scripts/chatbot.js` is currently unreferenced. `scripts/test.js` is also unreferenced and was retained because its purpose is not confirmed.

## Installation and Setup

1. Clone or download this repository.
2. Configure Firebase as described below.
3. Run a local HTTP server from the repository root. For example, with Python installed:

   ```bash
   python -m http.server 8000
   ```

4. Open `http://localhost:8000/explorer.html` in a modern browser.

The JavaScript uses ES modules and remote Firebase imports, so opening the HTML files directly with a `file://` URL is not a supported setup. There is no package manager manifest or build step in the current project.

## Firebase Configuration

The browser configuration is in `config/firebase-config.js`. Replace its Firebase project values with the client configuration for a Firebase project you control. The values used to initialize Firebase in a browser are client configuration; do not put service account credentials or server side private keys in this file.

For a working local setup, review the Firebase console and configure the services the code expects:

1. Enable Email/Password in Firebase Authentication.
2. Create/configure Cloud Firestore and apply restrictive Firestore security rules.
3. Configure Firebase App Check and its reCAPTCHA Enterprise site key for the domains where the app will run. The current site key is set in `scripts/indexjs.js`.
4. Firebase Storage is initialized, although no Storage upload operation was found. Seller product images currently use Cloudinary instead.
5. Review the Cloudinary cloud name and unsigned upload preset in `vendeur.html`; replace them with values for an account you control and restrict the preset appropriately. An unsigned preset is visible to every browser user.

No Firestore or Storage rules are included in this repository, so access control cannot be assessed from the checked-in files. Do not use real user data until rules have been reviewed and tested. The migration pages write shop documents to Firestore and should only be used by an authorized operator with the expected source JSON files and appropriately restricted rules.

## How to Run the Project

Use the local server instructions above and open `explorer.html`. Authentication, Firestore reads/writes, App Check, Cloudinary uploads, Formspree submissions, and CDN libraries require suitable service configuration and network access. The root URL does not have an `index.html` entry point in this repository.

## Screenshots

No screenshots are included yet. Capture real application states after configuring a safe demo Firebase project. Suggested portfolio captures:

1. Mall explorer with category navigation.
2. Registration or sign in page (without personal account details).
3. Product assistant showing a real demo query and results.
4. Favorites page with seeded demo shops.
5. Seller dashboard showing product and shop appearance tools.

Use only seeded demo content and avoid showing real emails, customer records, order identifiers, or private Firebase console data.

## Future Improvements

- Add the missing category/shop pages or update navigation to point to pages that are included.
- Implement and document a complete cart, order creation, and payment flow if those remain project goals.
- Add an administrator workflow if required by the product scope.
- Add and review Firestore and Storage rules, then document the data model.
- Move remaining inline page styles and scripts into reusable files after mapping their dependencies.
- Resolve or remove the unused legacy scripts after confirming their intended role.
- Add automated checks and browser-level verification.
- Add optimized, appropriately licensed screenshots and review the size of large media assets before public hosting.

## Author

Author name, preferred profile link, and contact details were not available in the project files. Complete this section before publishing the repository.

## GitHub Repository Preparation

- **Repository name:** `MyCityMall`
- **Short description:** `A Firebase powered multi shop e commerce web prototype built with HTML, CSS, and JavaScript.`
- **Suggested topics:** `ecommerce`, `multi-vendor`, `firebase`, `javascript`, `html`, `css`, `web-app`, `portfolio-project`

Review media rights, demo data, Firebase rules, and third party service configuration before creating a public remote repository.
