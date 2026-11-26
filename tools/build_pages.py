"""Generate the 4 portfolio pages from one shared header/footer template."""
import sys
from pathlib import Path

ROOT = Path(sys.argv[1])
SITE = "https://josh-portfolio.jt3rdegre3.com"
LINKEDIN = "https://www.linkedin.com/in/josue-tolentino-89b00a185/"

ICON_LINKEDIN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>'
ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 6.5h17v11h-17v-11Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
ICON_DOWNLOAD = '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ICON_ARROW = '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'

NAV = [("index.html", "home", "Home"), ("about.html", "about", "About"),
       ("credentials.html", "credentials", "Credentials"), ("contact.html", "contact", "Contact")]

DESC = ("Josue L. Tolentino Jr., QHSE Manager with 17+ years of professional experience across "
        "Oil & Gas, EPC, Quarrying and Construction. CQI | IRCA Lead Auditor (ISO 45001, 14001, 9001), "
        "Qualifi Level 7, NEBOSH.")


KEYWORDS = ("QHSE Manager, Senior QHSE Manager, HSE Manager, Health and Safety Manager, NEBOSH, "
            "ISO 45001 Lead Auditor, ISO 14001 Lead Auditor, ISO 9001 Lead Auditor, CQI IRCA Lead Auditor, "
            "Oil and Gas, EPC, Quarrying, Construction Safety, Risk Management, QHSE Leadership, Ireland")

JSON_LD = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Person","name":"Josue L. Tolentino Jr.","alternateName":"Josue Tolentino",
"jobTitle":"QHSE Manager","url":"https://josh-portfolio.jt3rdegre3.com/","image":"https://josh-portfolio.jt3rdegre3.com/profile.jpg",
"sameAs":["https://www.linkedin.com/in/josue-tolentino-89b00a185/"],
"address":{"@type":"PostalAddress","addressLocality":"Blessington","addressRegion":"Co. Wicklow","addressCountry":"IE"},
"knowsAbout":["QHSE Management","ISO 45001","ISO 14001","ISO 9001","HSE Auditing","Risk Management","Construction Safety","Oil and Gas HSE","EPC Safety Management","Quarrying Safety"],
"hasCredential":[{"@type":"EducationalOccupationalCredential","name":"Qualifi Level 7 International Diploma in Occupational Health and Safety Management"},
{"@type":"EducationalOccupationalCredential","name":"CQI/IRCA Lead Auditor ISO 45001, ISO 14001 and ISO 9001"},
{"@type":"EducationalOccupationalCredential","name":"NEBOSH International General Certificate in Occupational Health and Safety"}]}
</script>
"""

def head(title, desc, path, preload_photo=False):
    url = f"{SITE}/{'' if path == 'index.html' else path.replace('.html', '')}"
    photo = '<link rel="preload" href="profile.webp" as="image" type="image/webp">\n' if preload_photo else ""
    return f"""<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#000000">
<link rel="canonical" href="{url}">

<meta property="og:type" content="profile">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="keywords" content="{KEYWORDS}">
<meta name="author" content="Josue L. Tolentino Jr.">
<meta property="og:image" content="{SITE}/profile.jpg">
<meta property="og:site_name" content="Josue Tolentino | QHSE Manager">
{JSON_LD if path == 'index.html' else ''}
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%23000000'/%3E%3Ctext x='50' y='68' font-size='55' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-weight='bold'%3EJT%3C/text%3E%3C/svg%3E">
<link rel="preload" href="fonts/archivo-variable.woff2" as="font" type="font/woff2" crossorigin>
{photo}<link rel="stylesheet" href="styles.css">
</head>
"""


def header(page):
    def links(cls_extra=""):
        out = []
        for href, key, label in NAV:
            cur = ' aria-current="page"' if key == page else ""
            cls = ' class="nav-cta"' if key == "contact" and cls_extra == "main" else ""
            out.append(f'<a href="{href}"{cls}{cur}>{label}</a>')
        return out
    main = "\n      ".join(links("main"))
    mobile = "\n    ".join(links())
    return f"""<body data-page="{page}">

<canvas id="bg-canvas" class="bg-canvas" aria-hidden="true"></canvas>

<a href="#top" class="skip-link">Skip to content</a>

<header class="site-header">
  <div class="container header-inner">
    <a href="https://www.jt3rdegre3.com/" class="brand" target="_blank" rel="noopener noreferrer" aria-label="JT.3rDegre3 website (opens in a new tab)">JT<span>.3rDegre3</span></a>

    <nav class="main-nav" aria-label="Main navigation" id="main-nav">
      {main}
    </nav>

    <div class="header-actions">
      <a href="contact.html?request=resume" class="btn btn-ghost btn-small" id="resume-request" title="Request my resume" aria-label="Request my resume">
        {ICON_DOWNLOAD}
        <span class="resume-label-full">Request Resume</span><span class="resume-label-short">Resume</span>
      </a>
      <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch to light theme" aria-pressed="false">
        <svg class="icon icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
        <svg class="icon icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
      <button id="nav-toggle" class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation" hidden>
    {mobile}
    <a href="contact.html?request=resume">Request Resume</a>
  </nav>
</header>

<main id="top" class="page-main">
"""


def footer(modals=""):
    nav = "\n        ".join(f'<a href="{h}">{l}</a>' for h, _, l in NAV)
    return f"""</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <p class="footer-copy">&copy; <span id="footer-year"></span> Josue L. Tolentino Jr.</p>
    <nav class="footer-links" aria-label="Footer navigation">
        {nav}
    </nav>
    <div class="footer-social" aria-label="Social links">
      <a id="footer-linkedin" href="{LINKEDIN}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" class="social-icon">{ICON_LINKEDIN}</a>
      <a href="contact.html" aria-label="Send a message" class="social-icon">{ICON_MAIL}</a>
    </div>
  </div>
</footer>
{modals}
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
<script src="nav-fade.js"></script>
<script src="app.js"></script>
</body>
</html>
"""


def modal(kind, label):
    return f"""
<div id="{kind}-modal" class="modal-backdrop" hidden>
  <div class="modal-panel glass" role="dialog" aria-modal="true" aria-labelledby="{kind}-modal-title">
    <button type="button" class="modal-close" id="{kind}-modal-close" aria-label="Close">
      {ICON_CLOSE}
    </button>
    <p class="modal-eyebrow">{label}</p>
    <h3 id="{kind}-modal-title"></h3>
    <div id="{kind}-modal-body" class="modal-body"></div>
  </div>
</div>
"""


def page_hero(title, lead=""):
    lead_html = f'\n      <p class="page-lead">{lead}</p>' if lead else ""
    return f"""
  <section class="page-hero">
    <div class="container">
      <h1>{title}</h1>{lead_html}
    </div>
  </section>
"""


# ---------- Credentials ticker (all certificates in the PDF + NEBOSH, Highfield, RTITB instructor) ----------
CREDS = [
    ("Qualifi", "Level 7 Diploma, OHS Management"),
    ("CQI | IRCA", "ISO 45001:2018 Lead Auditor"),
    ("CQI | IRCA", "ISO 14001:2015 Lead Auditor"),
    ("CQI | IRCA", "ISO 9001:2015 Lead Auditor"),
    ("NEBOSH", "International General Certificate"),
    ("QQI", "Level 5, Quarrying Telescopic Handler Operations"),
    ("RTITB", "Counterbalance Truck Instructor"),
    ("Lantra Awards", "Working at Heights Instructor"),
    ("Nationwide Safety Training", "Abrasive Wheels Instructor"),
    ("Nationwide Safety Training", "Portable Appliance Testing"),
    ("Shorcontrol Safety", "Testing & Inspection of Machinery and Plant"),
    ("Lloyds British", "Portable Lifting Equipment Inspection"),
    ("Hickson Safety Services", "MEWP Safety Awareness"),
    ("Highfield", "Level 2 Fire Safety for Fire Wardens"),
    ("Institute of Safety Management", "Diploma, Industrial Safety & Health"),
    ("Institute of Safety Management", "Diploma, Fire & Safety Management"),
    ("IQRA Safety Consultancy", "HSE Engineering"),
    ("OHSEC", "Certified HSE Advisor"),
    ("Elite Safety Consultants", "IMS Internal Auditor"),
    ("Elite Safety Consultants", "Electrical Safety & PAT"),
    ("Elite Safety Consultants", "Fire Warden"),
    ("RICE USA", "Mechanical Engineering Professional Diploma"),
    ("IRMAP", "Member"),
    ("Hamad Medical Corporation", "Certificate of Appreciation"),
]


def ticker():
    items = "".join(f"<li><strong>{b}</strong><span>{c}</span></li>" for b, c in CREDS)
    return f"""        <div class="hero-creds">
          <p class="hero-creds-label">Credentials &amp; <br>Awarding Bodies</p>
          <div class="creds-marquee" aria-label="Credentials and awarding bodies">
            <ul class="creds-track">{items}</ul>
            <ul class="creds-track" aria-hidden="true">{items}</ul>
          </div>
        </div>
"""


HOME = f"""
  <section class="hero" aria-labelledby="hero-name">
    <div class="container">
      <div class="hero-frame">
        <div class="hero-grid">
          <div class="hero-copy reveal">
            <p class="eyebrow">Hello, I'm</p>
            <h1 id="hero-name"><span class="name-line">Josue</span> <span class="name-line">Tolentino</span></h1>
            <p class="hero-headline"><span class="hero-title">QHSE Manager</span><span class="hero-pipe" aria-hidden="true">|</span><span class="js-years">17</span>+ Years of Professional Experience Across Oil &amp; Gas, EPC, Quarrying &amp; Construction</p>
            <p class="hero-pillars"><span class="sr-only">Strategic Leadership · Risk Management · Compliance · Operational Excellence · QHSE Management</span><span class="pillar-typing" aria-hidden="true"><span class="pillar-prompt">&gt;_</span><span id="pillar-text" data-pillars="Strategic Leadership|Risk Management|Compliance|Operational Excellence|QHSE Management">Strategic Leadership</span><span class="pillar-caret"></span></span></p>
          </div>

          <figure class="hero-portrait">
            <picture>
              <source srcset="profile.webp" type="image/webp">
              <img src="profile.jpg" alt="Josue Tolentino, QHSE Manager" width="1000" height="1000" fetchpriority="high" decoding="async">
            </picture>
          </figure>
        </div>

{ticker()}      </div>

      <div class="stats-band">
        <div class="stat-item reveal delay-1">
          <span class="stat-num"><span class="js-years" data-count>17</span>+</span>
          <span class="stat-value">Years Experience</span>
          <span class="stat-label">HSE / QHSE Leadership</span>
        </div>
        <div class="stat-item reveal delay-2">
          <span class="stat-num"><span data-count>4</span></span>
          <span class="stat-value">Industry Sectors</span>
          <span class="stat-label">Oil &amp; Gas · EPC · Quarrying · Construction</span>
        </div>
        <div class="stat-item reveal delay-3">
          <span class="stat-num"><span id="stat-certs" data-count>…</span></span>
          <span class="stat-value">Professional Credentials</span>
          <span class="stat-label">Safety · Quality · Compliance</span>
        </div>
        <div class="stat-item reveal delay-4">
          <span class="stat-num"><span id="stat-projects" data-count>…</span></span>
          <span class="stat-value">International Projects</span>
          <span class="stat-label">Multicultural Site Experience</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section explore" aria-label="Explore the portfolio">
    <div class="container">
      <ol class="explore-list">
        <li class="reveal delay-1">
          <a href="about.html" class="explore-card">
            <span class="explore-num">01</span>
            <span class="explore-title">About &amp; Experience</span>
            <span class="explore-text">Six roles across Ireland, the UAE, KSA, Qatar and the Philippines, with major client projects.</span>
            <span class="explore-go">{ICON_ARROW}</span>
          </a>
        </li>
        <li class="reveal delay-2">
          <a href="credentials.html" class="explore-card">
            <span class="explore-num">02</span>
            <span class="explore-title">Credentials</span>
            <span class="explore-text">CQI | IRCA Lead Auditor, Qualifi Level 7, NEBOSH, instructor qualifications and client approvals.</span>
            <span class="explore-go">{ICON_ARROW}</span>
          </a>
        </li>
        <li class="reveal delay-3">
          <a href="contact.html" class="explore-card">
            <span class="explore-num">03</span>
            <span class="explore-title">Contact</span>
            <span class="explore-text">Recruiter, employer and project enquiries. Resume available on request.</span>
            <span class="explore-go">{ICON_ARROW}</span>
          </a>
        </li>
      </ol>
    </div>
  </section>
"""

ABOUT = page_hero("About Me") + """
  <section class="section about-section" id="about">
    <div class="container about-grid">
      <p id="hero-bio" class="about-bio reveal">I am an experienced QHSE Manager with 17+ years of professional experience across Quarrying, EPC, Oil &amp; Gas, and Construction industries.

My expertise spans strategic QHSE leadership, risk management, regulatory compliance, operational safety, and safety culture development. I am committed to protecting people, safeguarding assets, and driving continuous improvement and sustainable business performance.</p>
      <ul class="about-facts reveal delay-1">
        <li><strong>Location</strong><span id="about-location">Blessington, Co. Wicklow, Ireland</span></li>
        <li><strong>Experience</strong><span id="about-experience">17+ years</span></li>
        <li><strong>Current role</strong><span>QHSE Manager, Quarrying Operations</span></li>
        <li><strong>LinkedIn</strong><span id="about-linkedin"><a href="https://www.linkedin.com/in/josue-tolentino-89b00a185/" target="_blank" rel="noopener noreferrer">View profile</a></span></li>
      </ul>
    </div>
  </section>

  <section id="highlights" class="section added-section" aria-labelledby="highlights-title">
    <div class="container">
      <h2 id="highlights-title" class="reveal">Career Highlights</h2>
      <p class="section-hint reveal">Verified figures from my employment history, projects and client approvals.</p>
      <div class="stats-band highlights-band">
        <div class="stat-item reveal delay-1">
          <span class="stat-num"><span data-count>5</span></span>
          <span class="stat-value">Countries</span>
          <span class="stat-label">Ireland · UAE · Saudi Arabia · Qatar · Philippines</span>
        </div>
        <div class="stat-item reveal delay-2">
          <span class="stat-num">15M</span>
          <span class="stat-value">Safe Man-Hours Without LTI</span>
          <span class="stat-label">KAHRAMAA Phase 11, Qatar</span>
        </div>
        <div class="stat-item reveal delay-3">
          <span class="stat-num"><span data-count>6</span></span>
          <span class="stat-value">EPDs Secured</span>
          <span class="stat-label">Environmental Product Declarations, Kaprel Partitions</span>
        </div>
        <div class="stat-item reveal delay-4">
          <span class="stat-num"><span data-count>5</span></span>
          <span class="stat-value">Client HSE Approvals</span>
          <span class="stat-label">KAHRAMAA · QP · TRANSCO · ADDC · EMAL</span>
        </div>
      </div>
    </div>
  </section>

  <section id="focus" class="section section-alt added-section" aria-labelledby="focus-title">
    <div class="container">
      <h2 id="focus-title" class="reveal">Professional Focus</h2>
      <p class="section-hint reveal">The core areas of my QHSE practice, each backed by roles held and qualifications earned.</p>
      <div class="skills-grid">
        <div class="skill-card reveal">
          <h3>QHSE Leadership</h3>
          <ul><li>QHSE Manager, Quarrying Operations, Ireland (2024 – Present)</li><li>HSE Manager / IMS Representative, Kaprel Partitions LLC, UAE &amp; KSA</li><li>Deputy HSE Manager, Larsen &amp; Toubro Limited PT&amp;D, Qatar</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Occupational Health and Safety</h3>
          <ul><li>Qualifi Level 7 International Diploma in OHS Management</li><li>NEBOSH International General Certificate</li><li>CQI | IRCA ISO 45001:2018 Lead Auditor</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Environmental Management</h3>
          <ul><li>CQI | IRCA ISO 14001:2015 Lead Auditor</li><li>6 Environmental Product Declarations secured at Kaprel Partitions</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Quality Management Systems</h3>
          <ul><li>CQI | IRCA ISO 9001:2015 Lead Auditor</li><li>Integrated ISO 9001, ISO 14001 and ISO 45001 system as IMS Representative</li><li>IMS Internal Auditor (ISO 9001, 14001, 45001)</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Risk Assessment and Mitigation</h3>
          <ul><li>Hazard identification, HIRA / HAZID and Job Safety Analysis</li><li>Permit-to-Work, lifting operations, work at height and confined space safety</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Regulatory Compliance</h3>
          <ul><li>Approved HSE personnel for KAHRAMAA, QP, TRANSCO, ADDC and EMAL</li><li>Instructor-led training in line with the Safety, Health and Welfare at Work Act 2005 (Ireland)</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Continuous Improvement</h3>
          <ul><li>Lead and internal auditing across ISO 9001, ISO 14001 and ISO 45001</li><li>Root cause analysis and corrective action monitoring</li></ul>
        </div>
      </div>
    </div>
  </section>

  <section id="experience" class="section section-alt">
    <div class="container">
      <h2 class="reveal">Professional Journey</h2>
      <ol id="experience-list" class="timeline" aria-live="polite"></ol>
    </div>
  </section>

  <section id="projects" class="section">
    <div class="container">
      <h2 class="reveal">Major Client Projects</h2>
      <p class="section-hint reveal">Selected EPC, Oil &amp; Gas, and construction projects supported through HSE leadership and QHSE management.</p>
      <div id="projects-grid" class="projects-grid" aria-live="polite"></div>
    </div>
  </section>

  <section id="industries" class="section section-alt added-section" aria-labelledby="industries-title">
    <div class="container">
      <h2 id="industries-title" class="reveal">Industry Experience</h2>
      <p class="section-hint reveal">Where my QHSE experience was gained, by sector.</p>
      <div class="skills-grid">
        <div class="skill-card reveal">
          <h3>Oil &amp; Gas</h3>
          <ul><li>EMAL Phase 2 Cable Works (TRANSCO N-7137, 400 kV), UAE</li><li>HSE Engineer, Prysmian Cables, Dubai</li><li>Approved HSE personnel for Qatar Petroleum (QP)</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Engineering, Procurement &amp; Construction (EPC)</h3>
          <ul><li>Qatar Power Transmission System Expansion Phase 11 (New Port) for KAHRAMAA</li><li>Deputy HSE Manager, Larsen &amp; Toubro Limited PT&amp;D, Qatar</li><li>15 million safe man-hours without LTI across the project</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Quarrying &amp; Mining</h3>
          <ul><li>QHSE Manager, Quarrying Operations, Co. Wicklow, Ireland (2024 – Present)</li><li>QQI Level 5 Quarrying Telescopic Handler Operations</li><li>Testing &amp; inspection of machinery and plant</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Civil Engineering &amp; Construction</h3>
          <ul><li>Interior fit-out projects, UAE &amp; KSA</li><li>HSE Manager / IMS Representative, Kaprel Partitions LLC</li><li>Construction safety, contractor HSE management and site supervision</li></ul>
        </div>
      </div>
    </div>
  </section>

  <section id="education" class="section section-alt">
    <div class="container">
      <h2 class="reveal">Academic Background</h2>
      <ol id="education-list" class="timeline" aria-live="polite"></ol>
    </div>
  </section>
"""

CREDENTIALS = page_hero("Professional Credentials", "Industry-recognised qualifications in occupational safety, environmental management, quality, auditing and plant competence. Select any credential for full details.") + """
  <section id="certifications" class="section">
    <div class="container">
      <h2 class="reveal">Qualifications &amp; Training</h2>
      <div id="cert-filters" class="filter-chips" role="group" aria-label="Filter credentials by category" hidden></div>
      <ul id="certifications-list" class="card-list credential-grid" aria-live="polite"></ul>
    </div>
  </section>

  <section id="approvals" class="section section-alt accent-gold">
    <div class="container">
      <h2 class="reveal">Approvals &amp; Accreditations</h2>
      <ul id="approvals-list" class="chip-list" aria-live="polite"></ul>
    </div>
  </section>

  <section id="skills" class="section">
    <div class="container">
      <h2 class="reveal">Areas of Expertise</h2>
      <div id="skills-grid" class="skills-grid" aria-live="polite"></div>
    </div>
  </section>

  <section id="expertise" class="section section-alt added-section" aria-labelledby="expertise-title">
    <div class="container">
      <h2 id="expertise-title" class="reveal">Professional Expertise</h2>
      <p class="section-hint reveal">Each area is supported by the qualifications and experience listed on this portfolio.</p>
      <div class="skills-grid">
        <div class="skill-card reveal">
          <h3>QHSE Strategic Management</h3>
          <ul><li>QHSE Manager and HSE Manager / IMS Representative roles</li><li>Qualifi Level 7 Diploma in OHS Management</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>ISO 9001 Quality Management</h3>
          <ul><li>CQI | IRCA ISO 9001:2015 Lead Auditor</li><li>IMS Internal Auditor</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>ISO 14001 Environmental Management</h3>
          <ul><li>CQI | IRCA ISO 14001:2015 Lead Auditor</li><li>6 Environmental Product Declarations secured</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>ISO 45001 Occupational Health and Safety</h3>
          <ul><li>CQI | IRCA ISO 45001:2018 Lead Auditor</li><li>NEBOSH International General Certificate</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>HSE Auditing and Inspection</h3>
          <ul><li>Lead Auditor for ISO 45001, 14001 and 9001</li><li>Machinery &amp; plant, portable lifting equipment and PAT inspection</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Risk Assessment and Management</h3>
          <ul><li>HIRA / HAZID and Job Safety Analysis</li><li>Diploma in Industrial Safety &amp; Health</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Incident Investigation</h3>
          <ul><li>Incident investigation and root cause analysis</li><li>Certified HSE Advisor Course, OHSEC (Award for Scholastic Excellence)</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Contractor Management</h3>
          <ul><li>Contractor HSE management on EPC power projects</li><li>Larsen &amp; Toubro PT&amp;D and Prysmian Cables</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Emergency Preparedness</h3>
          <ul><li>Diploma in Fire &amp; Safety Management</li><li>Highfield Level 2 Fire Safety for Fire Wardens</li><li>Emergency drills</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Regulatory Compliance</h3>
          <ul><li>Approved HSE personnel for KAHRAMAA, QP, TRANSCO, ADDC and EMAL</li><li>Training in line with the Safety, Health and Welfare at Work Act 2005</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Safety Leadership</h3>
          <ul><li>Instructor: Working at Heights, Abrasive Wheels, RTITB Counterbalance Truck</li><li>Safety culture development and leadership engagement</li></ul>
        </div>
        <div class="skill-card reveal">
          <h3>Continuous Improvement</h3>
          <ul><li>Corrective action monitoring and QHSE reporting</li><li>Integrated management system implementation</li></ul>
        </div>
      </div>
    </div>
  </section>
"""

CONTACT = page_hero("Let's Connect", "Open to verified recruiters, employers, project owners and EPC contractors seeking experienced QHSE leadership.") + """
  <section id="contact" class="section contact-section">
    <div class="container">
      <div class="contact-grid">
        <div class="contact-left reveal">
          <p class="contact-intro">Send a short note about the role, project or opportunity and I will get back to you.</p>
          <ul class="about-facts">
            <li><strong>Location</strong><span id="contact-location">Blessington, Co. Wicklow, Ireland</span></li>
            <li><strong>LinkedIn</strong><span id="contact-linkedin"><a href="https://www.linkedin.com/in/josue-tolentino-89b00a185/" target="_blank" rel="noopener noreferrer">View profile</a></span></li>
          </ul>
          <p class="privacy-note">My resume, email and phone details are shared directly with verified recruiters and employers.</p>
        </div>

        <form id="access-form" class="access-form glass reveal delay-1" novalidate>
          <div class="form-row">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" required autocomplete="name" maxlength="200" placeholder="Your full name">
          </div>
          <div class="form-row">
            <label for="email">Work Email *</label>
            <input type="email" id="email" name="email" required autocomplete="email" maxlength="320" placeholder="you@company.com">
          </div>
          <div class="form-row">
            <label for="company">Company *</label>
            <input type="text" id="company" name="company" required autocomplete="organization" maxlength="200" placeholder="Company / Organization">
          </div>
          <div class="form-row">
            <label for="message">Message</label>
            <textarea id="message" name="message" rows="4" maxlength="2000" placeholder="Tell me about the role, project, or opportunity..."></textarea>
          </div>
          <div class="form-row">
            <label for="job_title">Job Title / Position</label>
            <input type="text" id="job_title" name="job_title" maxlength="200" placeholder="e.g. Senior QHSE Manager">
          </div>
          <div class="form-row">
            <label for="job_location">Job Location</label>
            <input type="text" id="job_location" name="job_location" maxlength="200" placeholder="e.g. Ireland, UAE, Saudi Arabia, or project location">
          </div>
          <div class="form-row">
            <label for="enquiry_type">Enquiry Type *</label>
            <select id="enquiry_type" name="enquiry_type" required>
              <option value="">Select an enquiry type</option>
              <option>Employment Opportunity</option>
              <option>Recruitment / Job Offer</option>
              <option>Project Opportunity</option>
              <option>EPC / Contractor Enquiry</option>
              <option>Professional Collaboration</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-row">
            <label for="job_description">Job Description / Opportunity Details</label>
            <textarea id="job_description" name="job_description" rows="7" maxlength="5000" class="textarea-lg" placeholder="Job responsibilities, project scope, employment requirements, required qualifications, contract information and any other relevant details."></textarea>
          </div>
          <!-- honeypot field: hidden from real users, bots tend to fill it in -->
          <div class="hp-field" aria-hidden="true">
            <label for="website">Leave this field empty</label>
            <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
          </div>

          <button type="submit" id="access-submit" class="btn btn-primary">Send Request</button>
          <p id="access-status" class="form-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>
  </section>
"""

PAGES = [
    ("index.html", "home", "Josue L. Tolentino Jr. | QHSE Manager", DESC, HOME, "", True),
    ("about.html", "about", "About & Experience | Josue L. Tolentino Jr., QHSE Manager",
     "Professional journey of Josue L. Tolentino Jr.: QHSE Manager with 17+ years across Quarrying, EPC, Oil & Gas and Construction in Ireland, the UAE, KSA, Qatar and the Philippines.",
     ABOUT, modal("project", "Project"), False),
    ("credentials.html", "credentials", "Credentials | Josue L. Tolentino Jr., QHSE Manager",
     "Professional credentials of Josue L. Tolentino Jr.: CQI | IRCA Lead Auditor (ISO 45001, 14001, 9001), Qualifi Level 7, NEBOSH, instructor qualifications and client approvals.",
     CREDENTIALS, modal("cert", "Certification"), False),
    ("contact.html", "contact", "Contact | Josue L. Tolentino Jr., QHSE Manager",
     "Contact Josue L. Tolentino Jr., QHSE Manager based in Co. Wicklow, Ireland, for recruiter, employer and project enquiries.",
     CONTACT, "", False),
]

for path, key, title, desc, body, modals, preload in PAGES:
    html = head(title, desc, path, preload) + header(key) + body + "\n" + footer(modals)
    assert "—" not in html, path
    (ROOT / path).write_text(html)
    print("wrote", path, len(html))
