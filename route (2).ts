import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username wajib diisi' }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, '');

    // 1. Panggil Roblox Users API resmi
    const rbxRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernames: [cleanUsername],
        excludeBannedUsers: true
      })
    });

    const rbxData = await rbxRes.json();
    const userObj = rbxData?.data?.[0];

    if (!userObj) {
      return NextResponse.json({ error: 'Username Roblox tidak ditemukan' }, { status: 404 });
    }

    // 2. Ambil foto Avatar Headshot dari Roblox Thumbnails API
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userObj.id}&size=150x150&format=Png&isCircular=false`
    );
    const thumbData = await thumbRes.json();
    const avatarUrl = thumbData?.data?.[0]?.imageUrl || null;

    return NextResponse.json({
      verified: true,
      userId: userObj.id,
      username: userObj.name,
      displayName: userObj.displayName,
      avatarUrl
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghubungi server Roblox' }, { status: 500 });
  }
}
