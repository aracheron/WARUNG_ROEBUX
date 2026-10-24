import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = (searchParams.get('u') || '').trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(u)) {
    return NextResponse.json({ found: false, error: 'invalid' }, { status: 400 });
  }

  try {
    const r = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [u], excludeBannedUsers: true }),
      cache: 'no-store'
    });
    if (!r.ok) throw new Error('roblox ' + r.status);
    const user = ((await r.json()).data || [])[0];
    if (!user) return NextResponse.json({ found: false });

    let avatar = '';
    try {
      const t = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`,
        { cache: 'no-store' }
      );
      avatar = (((await t.json()).data || [])[0] || {}).imageUrl || '';
    } catch (_) {}

    return NextResponse.json({
      found: true,
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      avatar
    });
  } catch (e) {
    return NextResponse.json({ found: false, error: 'upstream' }, { status: 502 });
  }
}
