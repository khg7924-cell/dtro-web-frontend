import { NextRequest, NextResponse } from 'next/server';

// 🌟 핵심: Vercel의 한국(서울, icn1) 서버에서 실행되도록 강제 지정
export const runtime = 'edge';
export const preferredRegion = 'icn1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'asos'; // 'asos' 또는 'aws'
  const stn = searchParams.get('stn') || '143';
  const authKey = searchParams.get('authKey') || 'vDWZwqskT6W1mcKrJL-l4w';

  let kmaUrl = '';

  if (type === 'aws') {
    // 1. 기상청 동네 방재기상관측(AWS) 일자료 URL
    const tm2 = searchParams.get('tm2') || '';
    const obs = searchParams.get('obs') || 'ta_max';
    kmaUrl = `https://apihub.kma.go.kr/api/typ01/url/sfc_aws_day.php?tm2=${tm2}&obs=${obs}&stn=${stn}&disp=0&help=0&authKey=${authKey}`;
  } else {
    // 2. 기상청 종관기상관측(ASOS) 일자료 URL
    const tm1 = searchParams.get('tm1') || '';
    const tm2 = searchParams.get('tm2') || '';
    kmaUrl = `https://apihub.kma.go.kr/api/typ01/url/kma_sfcdd3.php?tm1=${tm1}&tm2=${tm2}&stn=${stn}&help=1&authKey=${authKey}`;
  }

  try {
    const res = await fetch(kmaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
      },
      cache: 'no-store',
    });

    const buffer = await res.arrayBuffer();
    const text = new TextDecoder('euc-kr').decode(buffer);

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new NextResponse(`#ERROR: ${err.message}`, { status: 500 });
  }
}