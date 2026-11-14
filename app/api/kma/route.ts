import { NextRequest, NextResponse } from 'next/server';

// 🌟 Vercel 한국(서울, icn1) 서버에서 실행되도록 강제 지정
export const runtime = 'edge';
export const preferredRegion = 'icn1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'asos'; // 'asos' | 'aws' | 'air_daily' | 'air_sido'

  // 1. 기상청 인증키 및 환경공단(공공데이터포털) 인증키 기본값 설정
  const authKey = searchParams.get('authKey') || 'vDWZwqskT6W1mcKrJL-l4w';
  const serviceKey =
    searchParams.get('serviceKey') ||
    '4480c93a63159f09aebc2d0aa5ec7cff37503e60d6297b500e6da8d91e20f5cb';

  let targetUrl = '';
  let isAirKorea = false;

  if (type === 'air_daily') {
    // 🌟 [환경공단 1] 측정소별 일평균 대기오염통계 현황 (어제 날짜까지 공식 일평균 PM2.5)
    isAirKorea = true;
    const stationName =
      searchParams.get('stationName') || searchParams.get('msrstnName') || '수창동';
    const inqBginDt = searchParams.get('inqBginDt') || '20261101';
    const inqEndDt = searchParams.get('inqEndDt') || '20261113';
    const numOfRows = searchParams.get('numOfRows') || '100';
    const pageNo = searchParams.get('pageNo') || '1';

    targetUrl =
      `http://apis.data.go.kr/B552584/ArpltnStatsSvc/getMsrstnAcctoRDyrg` +
      `?serviceKey=${serviceKey}` +
      `&returnType=json` +
      `&numOfRows=${numOfRows}` +
      `&pageNo=${pageNo}` +
      `&inqBginDt=${inqBginDt}` +
      `&inqEndDt=${inqEndDt}` +
      `&msrstnName=${encodeURIComponent(stationName)}`;
  } else if (type === 'air_sido') {
    // 🌟 [환경공단 2] 시도별 실시간 측정정보 조회 (금일 대구 26개 측정소 실시간 PM2.5 일괄 조회)
    isAirKorea = true;
    const sidoName = searchParams.get('sidoName') || '대구';
    const numOfRows = searchParams.get('numOfRows') || '100';
    const pageNo = searchParams.get('pageNo') || '1';

    targetUrl =
      `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty` +
      `?serviceKey=${serviceKey}` +
      `&returnType=json` +
      `&numOfRows=${numOfRows}` +
      `&pageNo=${pageNo}` +
      `&sidoName=${encodeURIComponent(sidoName)}` +
      `&ver=1.0`;
  } else if (type === 'aws') {
    // [기상청 1] 동네 방재기상관측(AWS) 일자료
    const stn = searchParams.get('stn') || '0';
    const tm2 = searchParams.get('tm2') || '';
    const obs = searchParams.get('obs') || 'ta_max';
    targetUrl = `https://apihub.kma.go.kr/api/typ01/url/sfc_aws_day.php?tm2=${tm2}&obs=${obs}&stn=${stn}&disp=0&help=0&authKey=${authKey}`;
  } else {
    // [기상청 2] 종관기상관측(ASOS) 일자료
    const stn = searchParams.get('stn') || '143';
    const tm1 = searchParams.get('tm1') || '';
    const tm2 = searchParams.get('tm2') || '';
    targetUrl = `https://apihub.kma.go.kr/api/typ01/url/kma_sfcdd3.php?tm1=${tm1}&tm2=${tm2}&stn=${stn}&help=1&authKey=${authKey}`;
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
      },
      cache: 'no-store',
    });

    const buffer = await res.arrayBuffer();
    // 환경공단은 UTF-8 JSON, 기상청은 EUC-KR 텍스트로 디코딩
    const text = new TextDecoder(isAirKorea ? 'utf-8' : 'euc-kr').decode(buffer);

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': isAirKorea
          ? 'application/json; charset=utf-8'
          : 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new NextResponse(`#ERROR: ${err.message}`, { status: 500 });
  }
}