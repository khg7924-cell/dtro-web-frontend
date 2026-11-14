import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// 🌟 Edge 대신 Node.js 런타임 사용 (기상청 SSL 인증서 오류 우회 지원)
export const runtime = 'nodejs';
export const preferredRegion = 'icn1'; // 한국(서울) 서버에서 실행
export const dynamic = 'force-dynamic';

// 파이썬의 verify=False와 동일하게 SSL 인증서 검증을 건너뛰는 호출 함수
function fetchKmaIgnoreSsl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': '*/*',
        },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchKmaIgnoreSsl(res.headers.location).then(resolve).catch(reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('KMA request timeout'));
    });
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'asos';
  const stn = searchParams.get('stn') || '143';
  const authKey = searchParams.get('authKey') || 'vDWZwqskT6W1mcKrJL-l4w';

  let kmaUrl = '';

  if (type === 'aws') {
    const tm2 = searchParams.get('tm2') || '';
    const obs = searchParams.get('obs') || 'ta_max';
    kmaUrl = `https://apihub.kma.go.kr/api/typ01/url/sfc_aws_day.php?tm2=${tm2}&obs=${obs}&stn=${stn}&disp=0&help=0&authKey=${authKey}`;
  } else {
    const tm1 = searchParams.get('tm1') || '';
    const tm2 = searchParams.get('tm2') || '';
    kmaUrl = `https://apihub.kma.go.kr/api/typ01/url/kma_sfcdd3.php?tm1=${tm1}&tm2=${tm2}&stn=${stn}&help=1&authKey=${authKey}`;
  }

  try {
    const buffer = await fetchKmaIgnoreSsl(kmaUrl);
    const text = new TextDecoder('euc-kr').decode(buffer);

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new NextResponse(`#ERROR: ${err.code || ''} ${err.message}`, { status: 500 });
  }
}