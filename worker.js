// Cloudflare Worker — gates the entire site behind one shared password,
// then serves the static files (index.html, hero.jpg) via the ASSETS binding.
// The password lives in an Environment Variable called SITE_PASSWORD, set in
// the Cloudflare dashboard (Settings > Variables and Secrets), not in this file.

const COOKIE_NAME = "site_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Alexandra &amp; Justin</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Jost:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    height:100vh; display:flex; align-items:center; justify-content:center;
    background:#1C1108; font-family:'Jost', sans-serif; color:#F3ECE1;
  }
  .card { text-align:center; padding:40px; max-width:360px; width:100%; }
  h1 {
    font-family:'Cormorant Garamond', serif; font-weight:400; font-size:38px;
    margin-bottom:8px; letter-spacing:0.01em;
  }
  p.sub { font-size:12px; letter-spacing:0.28em; text-transform:uppercase; color:rgba(243,236,225,0.6); margin-bottom:32px; }
  input[type="password"] {
    width:100%; padding:14px 16px; background:transparent; border:1px solid rgba(243,236,225,0.4);
    color:#F3ECE1; font-family:'Jost', sans-serif; font-size:14px; letter-spacing:0.05em;
    outline:none; margin-bottom:16px;
  }
  input[type="password"]::placeholder { color:rgba(243,236,225,0.4); }
  input[type="password"]:focus { border-color:#8A3E1F; }
  button {
    width:100%; padding:14px; background:#5F1D08; color:#F3ECE1; border:none;
    font-family:'Jost', sans-serif; font-size:13px; letter-spacing:0.18em; text-transform:uppercase;
    cursor:pointer; transition:background 0.2s;
  }
  button:hover { background:#8A3E1F; }
  .error { color:#D98066; font-size:13px; margin-bottom:16px; min-height:16px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Alexandra &amp; Justin</h1>
    <p class="sub">Enter the password to continue</p>
    <form method="POST">
      <input type="password" name="password" placeholder="Password" autofocus required>
      <div class="error">${error ? "Incorrect password — try again." : ""}</div>
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const cookieHeader = request.headers.get("Cookie") || "";
    const isAuthed = cookieHeader
      .split(";")
      .some((c) => c.trim() === `${COOKIE_NAME}=ok`);

    if (isAuthed) {
      return env.ASSETS.fetch(request);
    }

    if (request.method === "POST") {
      const formData = await request.formData();
      const submitted = formData.get("password");

      if (submitted === env.SITE_PASSWORD) {
        const response = new Response(null, {
          status: 303,
          headers: { Location: "/" },
        });
        response.headers.append(
          "Set-Cookie",
          `${COOKIE_NAME}=ok; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`
        );
        return response;
      }

      return new Response(loginPage(true), {
        status: 401,
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(loginPage(false), {
      status: 401,
      headers: { "Content-Type": "text/html" },
    });
  },
};
