import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import crypto from 'crypto';

// 🌟 Node.js 런타임 + Vercel 서울(icn1) 리전 고정 (한전 11080 포트 SSL 인증서 우회 필수)
export const runtime = 'nodejs';
export const preferredRegion = 'icn1';
export const dynamic = 'force-dynamic';

const DEFAULT_KEPCO_KEY = '6lrb2gu8t5dzg3a3505s';

function requestKepco(targetUrl: string, timeoutMs = 12000): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const secureOptions =
      typeof crypto.constants?.SSL_OP_LEGACY_SERVER_CONNECT === 'number'
        ? crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
        : 0;

    const req = https.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        rejectUnauthorized: false,
        secureOptions,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json, text/plain, */*',
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf-8');
          resolve({ statusCode: res.statusCode || 500, body });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('KEPCO_TIMEOUT'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'lp'; // 'lp' | 'bill'
  const custNo = searchParams.get('custNo') || '';
  const serviceKey = searchParams.get('serviceKey') || DEFAULT_KEPCO_KEY;
  const returnType = searchParams.get('returnType') || '02';

  if (!custNo) {
    return NextResponse.json({ error: 'custNo 파라미터가 필요합니다.' }, { status: 400 });
  }

  let targetUrl = '';
  if (type === 'bill') {
    const dataMonth = searchParams.get('dataMonth') || '';
    if (!dataMonth) {
      return NextResponse.json({ error: 'dataMonth 파라미터가 필요합니다.' }, { status: 400 });
    }
    targetUrl =
      `https://opm.kepco.co.kr:11080/OpenAPI/getCustBillData.do` +
      `?custNo=${encodeURIComponent(custNo)}` +
      `&dataMonth=${encodeURIComponent(dataMonth)}` +
      `&serviceKey=${encodeURIComponent(serviceKey)}` +
      `&returnType=${encodeURIComponent(returnType)}`;
  } else {
    const date = (searchParams.get('date') || '').replace(/-/g, '');
    if (!date) {
      return NextResponse.json({ error: 'date 파라미터가 필요합니다.' }, { status: 400 });
    }
    targetUrl =
      `https://opm.kepco.co.kr:11080/OpenAPI/getDayLpData.do` +
      `?custNo=${encodeURIComponent(custNo)}` +
      `&date=${encodeURIComponent(date)}` +
      `&serviceKey=${encodeURIComponent(serviceKey)}` +
      `&returnType=${encodeURIComponent(returnType)}`;
  }

  try {
    const { statusCode, body } = await requestKepco(targetUrl, 12000);

    if (statusCode !== 200) {
      return NextResponse.json(
        { error: `KEPCO HTTP ${statusCode}`, preview: body.slice(0, 200) },
        { status: 502 }
      );
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    const isTimeout = err?.message === 'KEPCO_TIMEOUT';
    return NextResponse.json(
      { error: isTimeout ? '한전 API 응답 시간 초과(12초)' : `한전 API 중계 오류: ${err?.message || 'unknown'}` },
      { status: isTimeout ? 504 : 502 }
    );
  }
}