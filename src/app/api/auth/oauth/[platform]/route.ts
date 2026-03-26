import { NextResponse } from "next/server";

const PLATFORM_CONFIG: Record<string, { name: string; color: string; bgColor: string; icon: string }> = {
  x: { name: "X (Twitter)", color: "#000000", bgColor: "#f5f5f5", icon: "𝕏" },
  tiktok: { name: "TikTok", color: "#010101", bgColor: "#f5f5f5", icon: "♪" },
  instagram: { name: "Instagram", color: "#E4405F", bgColor: "#fafafa", icon: "📷" },
  facebook: { name: "Facebook", color: "#1877F2", bgColor: "#f0f2f5", icon: "f" },
  snapchat: { name: "Snapchat", color: "#FFFC00", bgColor: "#f5f5f5", icon: "👻" },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const config = PLATFORM_CONFIG[platform.toLowerCase()];

  if (!config) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 404 });
  }

  const url = new URL(req.url);
  const callbackUrl = `${url.origin}/api/auth/callback/${platform.toLowerCase()}`;

  // Render a simulated OAuth login page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${config.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${config.bgColor};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      padding: 40px;
      width: 100%;
      max-width: 400px;
    }
    .logo {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: ${config.color};
      color: ${config.color === '#FFFC00' ? '#000' : '#fff'};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      margin: 0 auto 20px;
    }
    h1 {
      text-align: center;
      font-size: 22px;
      color: #1a1a1a;
      margin-bottom: 6px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-bottom: 28px;
    }
    .field {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: ${config.color === '#FFFC00' ? '#333' : config.color};
    }
    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      background: ${config.color === '#FFFC00' ? '#333' : config.color};
      color: white;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .divider {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin: 20px 0;
      position: relative;
    }
    .divider::before, .divider::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 40%;
      height: 1px;
      background: #e0e0e0;
    }
    .divider::before { left: 0; }
    .divider::after { right: 0; }
    .notice {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 20px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .permissions {
      font-size: 13px;
      color: #555;
      margin: 16px 0;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .permissions p { margin-bottom: 8px; font-weight: 600; }
    .permissions ul { padding-left: 20px; }
    .permissions li { margin: 4px 0; }
    .cancel {
      display: block;
      text-align: center;
      margin-top: 12px;
      color: #666;
      text-decoration: none;
      font-size: 14px;
    }
    .cancel:hover { color: #333; }
    .error { color: #e53935; font-size: 13px; margin-top: 8px; display: none; }
    .loading { display: none; }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">${config.icon}</div>
    <h1>Sign in to ${config.name}</h1>
    <p class="subtitle">Authorize Social Market to access your account</p>

    <form id="authForm">
      <div class="field">
        <label for="username">Username or Email</label>
        <input type="text" id="username" placeholder="Enter your ${config.name} username" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" placeholder="Enter your password" required />
      </div>

      <div class="permissions">
        <p>Social Market is requesting access to:</p>
        <ul>
          <li>Read your profile information</li>
          <li>Create and publish posts</li>
          <li>View post analytics and insights</li>
        </ul>
      </div>

      <p class="error" id="error"></p>

      <button type="submit" class="btn" id="submitBtn">
        <span class="normal">Authorize Social Market</span>
        <span class="loading"><span class="spinner"></span> Connecting...</span>
      </button>
    </form>

    <a href="javascript:window.close()" class="cancel">Cancel</a>

    <div class="notice">
      This is a development OAuth simulation.<br>
      Enter any username and password to connect.
    </div>
  </div>

  <script>
    document.getElementById('authForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!username || !password) {
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = 'Please fill in all fields.';
        return;
      }

      // Show loading state
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.querySelector('.normal').style.display = 'none';
      btn.querySelector('.loading').style.display = 'inline';

      // Simulate OAuth delay then redirect to callback
      setTimeout(function() {
        const code = btoa(JSON.stringify({
          username: username,
          platform: '${platform.toLowerCase()}',
          ts: Date.now()
        }));
        window.location.href = '${callbackUrl}?code=' + encodeURIComponent(code) + '&username=' + encodeURIComponent(username);
      }, 1500);
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
