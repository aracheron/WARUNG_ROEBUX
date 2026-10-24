// Vercel Serverless Function: Cek Username Roblox + Validasi + Real 3D Avatar Headshot
// Taruh di: api/roblox-check.js  (Node 18+ di Vercel)
// Endpoint: /api/roblox-check?u=USERNAME
// Menggabungkan:
// 1. https://auth.roblox.com/v1/usernames/validate?request.username=[UsernameHere]&request.birthday=2000-01-01
// 2. https://users.roblox.com/v1/usernames/users (Lookup User ID & DisplayName asli)
// 3. https://thumbnails.roblox.com/v1/users/avatar-headshot (Ambil URL foto Avatar 3D riil tr.rbxcdn.com)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  const u = String((req.query || {}).u || (req.query || {}).username || "").replace(/^@/, "").trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) {
    return res.status(400).json({ found: false, error: "invalid" });
  }

  try {
    // 1. Validasi username via auth.roblox.com/v1/usernames/validate
    let validationCode = null;
    let validationMessage = "";
    try {
      const valRes = await fetch(
        `https://auth.roblox.com/v1/usernames/validate?request.username=${encodeURIComponent(u)}&request.birthday=2000-01-01&request.context=Signup`
      );
      if (valRes.ok) {
        const valJson = await valRes.json();
        validationCode = valJson.code;
        validationMessage = valJson.message || "";
      }
    } catch (_) {}

    // 2. Ambil User ID & DisplayName asli dari users.roblox.com
    const r = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [u], excludeBannedUsers: true }),
    });
    if (!r.ok) throw new Error("roblox " + r.status);
    let user = ((await r.json()).data || [])[0];

    // Fallback ke users/search jika dibutuhkan
    if (!user) {
      const sRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(u)}&limit=10`);
      if (sRes.ok) {
        const sList = (await sRes.json()).data || [];
        user = sList.find(item => String(item.name || "").toLowerCase() === u.toLowerCase()) || null;
      }
    }

    if (!user) {
      return res.status(200).json({
        found: false,
        validationCode,
        validationMessage: validationMessage || "Username not registered"
      });
    }

    // 3. Ambil foto Avatar 3D riil (https://tr.rbxcdn.com/...) dari thumbnails.roblox.com
    let avatar = "";
    try {
      const t = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`
      );
      if (t.ok) {
        avatar = (((await t.json()).data || [])[0] || {}).imageUrl || "";
      }
    } catch (_) {}

    return res.status(200).json({
      found: true,
      valid: true,
      validationEndpoint: `https://auth.roblox.com/v1/usernames/validate?request.username=${encodeURIComponent(user.name)}`,
      validationCode: validationCode ?? 1,
      validationMessage: validationMessage || "Username is already in use (Active Roblox Account)",
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      avatar,
      profileUrl: `https://www.roblox.com/users/${user.id}/profile`
    });
  } catch (e) {
    return res.status(502).json({ found: false, error: "upstream" });
  }
}
