#!/usr/bin/env python3
"""
Zhannah portfolio server.
Serves the static site and handles the contact form.

SETUP (one time):
  1. Open config.json and fill in your Gmail address + App Password
  2. Double-click start.command  (or run: python3 server.py)
  3. Open http://localhost:8080 in your browser

How to get a Gmail App Password:
  1. Go to myaccount.google.com → Security
  2. Enable 2-Step Verification (if not already on)
  3. Search "App passwords" → create one called "Zhannah site"
  4. Paste the 16-character password into config.json
"""

import http.server, json, os, smtplib, ssl, pathlib, re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from html import escape

SITE_DIR   = pathlib.Path(__file__).parent
CONFIG     = SITE_DIR / 'config.json'

def load_config():
    if not CONFIG.exists():
        return {}
    with open(CONFIG) as f:
        return json.load(f)

def valid_email(s):
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', s))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    # ── CONTACT API ─────────────────────────────────────────────
    def do_POST(self):
        if self.path != '/api/contact':
            self.json(404, {'error': 'Not found.'})
            return

        length = int(self.headers.get('Content-Length', 0))
        try:
            data = json.loads(self.rfile.read(length))
        except Exception:
            self.json(400, {'error': 'Invalid request.'})
            return

        name    = str(data.get('name', '')).strip()
        email   = str(data.get('email', '')).strip()
        project = str(data.get('project_type', '')).strip()
        message = str(data.get('message', '')).strip()

        if not name:
            self.json(400, {'error': 'Please enter your name.'})
            return
        if not email or not valid_email(email):
            self.json(400, {'error': 'Please enter a valid email address.'})
            return
        if not message:
            self.json(400, {'error': 'Please write a message.'})
            return

        cfg = load_config()
        email_user = cfg.get('email_user', '').strip()
        email_pass = cfg.get('email_pass', '').strip()
        email_to   = cfg.get('email_to', 'zm6466x@gre.ac.uk').strip()

        if not email_user or not email_pass or 'your' in email_user:
            self.json(500, {'error': 'Email not configured yet. Please fill in config.json.'})
            return

        try:
            self.send_enquiry(email_user, email_pass, email_to, name, email, project, message)
            self.json(200, {'success': True})
        except smtplib.SMTPAuthenticationError:
            self.json(500, {'error': 'Email authentication failed. Check your password in config.json.'})
        except Exception as e:
            print(f'[email error] {e}')
            self.json(500, {'error': 'Could not send message. Please try again or email directly.'})

    def send_enquiry(self, user, password, to, name, sender_email, project, message):
        subject = f'Portfolio enquiry from {name}'
        if project:
            subject += f' — {project}'

        msg = MIMEMultipart('alternative')
        msg['Subject']  = subject
        msg['From']     = f'Zhannah Site <{user}>'
        msg['To']       = to
        msg['Reply-To'] = f'{name} <{sender_email}>'

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body  {{ font-family: Georgia, serif; background: #FDFAF6; margin: 0; padding: 0; }}
    .wrap {{ max-width: 580px; margin: 40px auto; background: #fff;
             border-radius: 20px; overflow: hidden;
             box-shadow: 0 8px 40px rgba(44,38,38,.08); }}
    .top  {{ background: #E892A7; padding: 32px 36px; }}
    .top h1 {{ margin: 0; color: #fff; font-size: 1.5rem; font-weight: 500; }}
    .top p  {{ margin: 6px 0 0; color: rgba(255,255,255,.82); font-size: .9rem; font-style: italic; }}
    .body {{ padding: 32px 36px; color: #2C2626; }}
    .meta {{ background: #FFF8E1; border-radius: 12px; padding: 18px 20px;
             margin-bottom: 24px; font-size: .9rem; line-height: 1.8; }}
    .meta strong {{ color: #E892A7; }}
    .msg  {{ line-height: 1.85; white-space: pre-wrap; font-size: 1rem; color: #4A3F3F; }}
    .foot {{ padding: 20px 36px; border-top: 1px solid #F7C3CF;
             font-size: .78rem; color: #8A7A7A; font-style: italic; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <h1>New enquiry</h1>
      <p>Someone reached out through your portfolio.</p>
    </div>
    <div class="body">
      <div class="meta">
        <strong>From:</strong> {escape(name)} ({escape(sender_email)})<br>
        {f'<strong>Project:</strong> {escape(project)}<br>' if project else ''}
      </div>
      <div class="msg">{escape(message)}</div>
    </div>
    <div class="foot">
      Reply directly to this email to respond to {escape(name)}.
    </div>
  </div>
</body>
</html>"""

        msg.attach(MIMEText(html_body, 'html'))
        ctx = ssl.create_default_context()
        # Auto-detect SMTP provider from email domain
        domain = user.split('@')[-1].lower()
        if domain == 'gmail.com':
            with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=ctx) as s:
                s.login(user, password)
                s.sendmail(user, to, msg.as_string())
        else:
            # Outlook / Office 365 (covers @gre.ac.uk and most university emails)
            with smtplib.SMTP('smtp.office365.com', 587) as s:
                s.ehlo()
                s.starttls(context=ctx)
                s.login(user, password)
                s.sendmail(user, to, msg.as_string())

    # ── JSON HELPER ──────────────────────────────────────────────
    def json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        status = (fmt % args).split('"')[1] if '"' in fmt % args else fmt % args
        print(f'  {status}')


if __name__ == '__main__':
    cfg  = load_config()
    port = int(cfg.get('port', 8080))
    user = cfg.get('email_user', '')
    ok   = user and 'your' not in user

    print()
    print('  ✦  Zhannah portfolio')
    print(f'  →  http://localhost:{port}')
    print()
    if not ok:
        print('  ⚠  Email not configured — open config.json to set it up')
    else:
        print(f'  ✉  Emails will be sent from {user}')
    print()

    server = http.server.ThreadingHTTPServer(('', port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Site stopped.')
