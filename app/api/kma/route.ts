import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const preferredRegion = 'icn1'; // 한국(서울) IP 강제 지정

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'asos';

  try {
    // 1. [오늘 실시간용] 한국환경공단 시도별 실시간 측정정보 (대구 26개 측정소 1회 일괄 조회)
    if (type === 'air_sido') {
      const serviceKey = searchParams.get('serviceKey') || '';
      const numOfRows = searchParams.get('numOfRows') || '100';
      const airUrl = `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${serviceKey}&returnType=json&numOfRows=${numOfRows}&pageNo=1&sidoName=${encodeURIComponent('대구')}&ver=1.0`;
      
      const res = await fetch(airUrl, { cache: 'no-store' });
      const text = await res.text();
      return new NextResponse(text, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 🌟 2. [어제까지 일평균용] 한국환경공단 대기오염통계 현황 - 측정소별 실시간 일평균 정보 조회 (getMsrstnAcctoRDyrg)
    if (type === 'air_daily') {
      const serviceKey = searchParams.get('serviceKey') || '';
      const stationName = searchParams.get('stationName') || '수창동';
      const inqBginDt = searchParams.get('inqBginDt') || '';
      const inqEndDt = searchParams.get('inqEndDt') || '';
      const numOfRows = searchParams.get('numOfRows') || '100';
      const statsUrl = `http://apis.data.go.kr/B552584/ArpltnStatsSvc/getMsrstnAcctoRDyrg?serviceKey=${serviceKey}&returnType=json&numOfRows=${numOfRows}&pageNo=1&inqBginDt=${inqBginDt}&inqEndDt=${inqEndDt}&msrstnName=${encodeURIComponent(stationName)}`;

      const res = await fetch(statsUrl, { cache: 'no-store' });
      const text = await res.text();
      return new NextResponse(text, {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 3. 기상청 AWS / ASOS 조회
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

    const res = await fetch(kmaUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
      cache: 'no-store',
    });
    const buffer = await res.arrayBuffer();
    const text = new TextDecoder('euc-kr').decode(buffer);

    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new NextResponse(`#ERROR: ${err.message}`, { status: 500 });
  }
}