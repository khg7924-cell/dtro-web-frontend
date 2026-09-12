'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart 
} from 'recharts';

const API_URL = 'https://dtro-api.onrender.com'; 

const theme = {
  bg: '#F8FAFC', surface: '#FFFFFF', primary: '#0F62FE', primarySoft: '#EDF5FF', 
  secondary: '#8A3FFC', ai: '#E83E8C', success: '#198038', danger: '#DA1E28', 
  textMain: '#111827', textMuted: '#64748B', border: '#E2E8F0', shadow: '0 4px 24px rgba(0, 0, 0, 0.04)', radius: '16px',         
};

const getLocalISODate = (d?: Date) => {
  const target = d || new Date();
  const utc = target.getTime() + (target.getTimezoneOffset() * 60000);
  const kstDate = new Date(utc + (3600000 * 9)); 
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const router = useRouter();
  
  // 🌟 [권한 관리] 실제 시스템에서는 로그인 세션에서 가져올 ID입니다.
  const [userId, setUserId] = useState('20140165'); // 테스트용으로 하드코딩 (원하시면 변경 가능)
  const isAdmin = userId === '20140165';

  // 🌟 [서버 데이터 상태] 파일 업로드가 아닌, 서버에 파일이 존재하는지 여부를 추적합니다.
  const [isDatasetReady, setIsDatasetReady] = useState(false);
  const [datasetDate, setDatasetDate] = useState('');

  // 컴포넌트가 켜질 때 서버에 엑셀 파일이 있는지 검사합니다.
  const checkDatasetStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/check_dataset`);
      const data = await res.json();
      if (data.exists) {
        setIsDatasetReady(true);
        setDatasetDate(data.updated_at);
      }
    } catch (e) {
      console.error("데이터셋 상태 확인 실패", e);
    }
  };

  useEffect(() => {
    checkDatasetStatus();
  }, []);

  const [mainTab, setMainTab] = useState('dashboard');
  const [station, setStation] = useState('전체');
  const [mappedLocation, setMappedLocation] = useState('대구 전체');
  const [chartData, setChartData] = useState<any[]>([]);
  
  const [rawRecords, setRawRecords] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15; 
  
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
  
  const [chartMode, setChartMode] = useState('daily'); 
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  
  const maxDate = getLocalISODate();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 14);
    return getLocalISODate(d);
  });
  const [endDate, setEndDate] = useState(() => {
    return getLocalISODate(); 
  });
  const [weatherTab, setWeatherTab] = useState('temp');

  const [baseYear, setBaseYear] = useState('2024');
  const [compYear, setCompYear] = useState('2025');
  const [unitPrice, setUnitPrice] = useState('150');
  const [compRecords, setCompRecords] = useState<any[]>([]);
  const [compSummary, setCompSummary] = useState<any>({});
  const [compLoading, setCompLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');

  const [targetYear, setTargetYear] = useState('2026');
  const [passRate, setPassRate] = useState('5.0');
  const [tempAdj, setTempAdj] = useState('+1.5');
  const [winterTempAdj, setWinterTempAdj] = useState('-2.0');
  const [pm25Adj, setPm25Adj] = useState('+15');
  
  const [predLoading, setPredLoading] = useState(false);
  const [predSummary, setPredSummary] = useState<any>(null);
  const [predChartData, setPredChartData] = useState<any[]>([]);
  const [featChartData, setFeatChartData] = useState<any[]>([]);

  const [billYear, setBillYear] = useState('2026');
  const [billRecords, setBillRecords] = useState<any[]>([]);
  const [billLoading, setBillLoading] = useState(false);
  const [billCustNo, setBillCustNo] = useState('');

  const handleMasterBackup = () => {
    if (!isDatasetReady) {
      alert("베이스가 될 기존 통합 데이터셋이 서버에 없습니다. 먼저 업로드해주세요.");
      return;
    }
    window.location.href = `${API_URL}/api/backup`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          alert(`✅ [관리자 권한] ${file.name}\n데이터셋이 서버에 전역 저장되었습니다.\n이제 모든 사용자가 분석 기능을 사용할 수 있습니다.`);
          checkDatasetStatus(); // 🌟 업로드 즉시 서버 상태 동기화
        } else {
          alert("파일 업로드에 실패했습니다. (서버 응답 오류)");
        }
      } catch (error) {
        alert("백엔드 서버가 켜져 있는지 확인해 주세요.");
      }
    }
  };

  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    '전체': true, '1호선': false, '2호선': false, '3호선': false,
  });

  const stationsData: { [key: string]: string[] } = {
    '1호선': ['설화명곡', '월배기지', '서부정류장', '반월당', '신천', '방촌', '안심', '숙천', '금락'],
    '2호선': ['문양기지', '대실', '성서산단', '죽전', '반고개', '대구은행', '만촌', '수성알파시티', '사월', '영남대'],
    '3호선': ['칠곡기지', '팔달시장', '남산', '범물기지'],
  };

  const toggleMenu = (menu: string) => setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  const toggleRow = (date: string) => setExpandedRows(prev => ({ ...prev, [date]: !prev[date] }));

  const fetchDashboardData = async () => {
    setLoading(true);
    setCurrentPage(1); 
    try {
      const response = await fetch(`${API_URL}/api/dashboard/${encodeURIComponent(station)}?start=${startDate}&end=${endDate}`);
      const result = await response.json();
      
      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      const records = result.daily_records || [];
      const reversedRecords = [...records].reverse(); 
      setRawRecords(reversedRecords);
      setMappedLocation(result.mapped_location || '대구 전체');
      setSummary(result.summary || {});

      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays > 31) {
        const monthMap: { [key: string]: any[] } = {};
        records.forEach((r: any) => {
          const mKey = r.date.substring(0, 7);
          if (!monthMap[mKey]) monthMap[mKey] = [];
          monthMap[mKey].push(r);
        });
        
        const monthlyData = Object.keys(monthMap).map((mKey) => {
          const group = monthMap[mKey];
          const count = group.length;
          const validTMax = group.filter((r: any) => r.temp_max !== '--' && r.temp_max !== null);
          const validTMin = group.filter((r: any) => r.temp_min !== '--' && r.temp_min !== null);
          const validHum = group.filter((r: any) => r.humidity !== '--' && r.humidity !== null);
          const validPm = group.filter((r: any) => r.pm25 !== '--' && r.pm25 !== null);

          return {
            date: `${mKey}월`,
            usage_kwh: Math.round(group.reduce((acc: number, cur: any) => acc + cur.usage_kwh, 0)),
            peak_kw: Math.round(group.reduce((acc: number, cur: any) => acc + cur.peak_kw, 0) / count),
            temp_max: validTMax.length > 0 ? Number((validTMax.reduce((acc: number, cur: any) => acc + Number(cur.temp_max), 0) / validTMax.length).toFixed(1)) : null,
            temp_min: validTMin.length > 0 ? Number((validTMin.reduce((acc: number, cur: any) => acc + Number(cur.temp_min), 0) / validTMin.length).toFixed(1)) : null,
            humidity: validHum.length > 0 ? Number((validHum.reduce((acc: number, cur: any) => acc + Number(cur.humidity), 0) / validHum.length).toFixed(1)) : null,
            pm25: validPm.length > 0 ? Number((validPm.reduce((acc: number, cur: any) => acc + Number(cur.pm25), 0) / validPm.length).toFixed(1)) : null,
          };
        });
        setChartData(monthlyData);
      } else {
        setChartData(records.map((r: any) => ({ ...r, date: r.date.substring(5) })));
      }
      setExpandedRows({});
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchRealtimeData = async () => {
    setRealtimeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/realtime/${encodeURIComponent(station)}`);
      const result = await response.json();
      
      if (result.error) {
        alert(result.error);
        setRealtimeLoading(false);
        return;
      }

      setRealtimeData(result.records || []);
    } catch (error) { console.error(error); } finally { setRealtimeLoading(false); }
  };

  const fetchCompareData = async () => {
    if (!isDatasetReady) { alert("서버에 연동된 데이터셋이 없습니다. 관리자에게 업로드를 요청하세요."); return; }
    
    setCompLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/compare/${encodeURIComponent(station)}?base_year=${baseYear}&comp_year=${compYear}&price=${unitPrice}`);
      const result = await response.json();
      if (result.error) { alert(result.error); setCompLoading(false); return; }
      setCompRecords(result.records || []);
      setCompSummary(result.summary || {});
      setAiReport(result.summary?.ai_report || '리포트 생성 중 오류가 발생했습니다.');
    } catch (error) { console.error(error); alert('비교 분석 서버와 통신할 수 없습니다.'); } finally { setCompLoading(false); }
  };

  const runAIPrediction = async () => {
    if (!isDatasetReady) { alert("서버에 연동된 데이터셋이 없습니다. 관리자에게 업로드를 요청하세요."); return; }
    
    setPredLoading(true);
    setPredSummary(null);
    setPredChartData([]);
    setFeatChartData([]);

    try {
      const response = await fetch(`${API_URL}/api/predict/${encodeURIComponent(station)}?target_year=${targetYear}&pass_rate=${passRate}&temp_adj=${tempAdj}&winter_temp_adj=${winterTempAdj}&pm25_adj=${pm25Adj}`);
      const result = await response.json();
      if (result.error) { alert(result.error); setPredLoading(false); return; }
      setPredSummary(result.summary); setPredChartData(result.chart_data); setFeatChartData(result.feat_data);
    } catch (error) { alert('AI 예측 서버와 통신할 수 없습니다.'); } finally { setPredLoading(false); }
  };

  const fetchBillData = async () => {
    let targetStation = station;
    if (stationsData['1호선'].includes(station)) {
      targetStation = '1호선';
      setStation('1호선');
    }
    
    setBillLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/bill/${encodeURIComponent(targetStation)}?year=${billYear}`);
      const result = await response.json();
      if (result.error) {
        alert(result.error);
        setBillRecords([]);
        setBillLoading(false);
        return;
      }
      setBillRecords(result.records || []);
      setBillCustNo(result.cust_no || '');
    } catch(e) {
      console.error(e);
      alert("전기요금 서버 통신 에러");
    } finally {
      setBillLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (rawRecords.length === 0) { alert("다운로드할 데이터가 없습니다."); return; }
    let csvContent = "\uFEFF항목(일자/시간),사용량(kWh),최대수요(kW),CO2(tCO2),최고기온(°C),최저기온(°C),습도(%),PM2.5\n";
    rawRecords.forEach(row => {
      csvContent += `${row.date},${row.usage_kwh},${row.peak_kw},${row.co2},${row.temp_max},${row.temp_min},${row.humidity},${row.pm25}\n`;
      if (row.details) {
        row.details.forEach((d: any) => {
          const co2 = (d.usage_kwh * 0.466 / 1000).toFixed(3);
          csvContent += `${row.date} ${d.time},${d.usage_kwh},${d.peak_kw},${co2},-,-,-,-\n`;
        });
      }
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${station}_통합대시보드_상세데이터.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportCompareExcel = () => {
    if (compRecords.length === 0) { alert("다운로드할 비교 데이터가 없습니다."); return; }
    let csvContent = `\uFEFF월별,${baseYear}년_기준(kWh),${compYear}년_비교(kWh),증감량(kWh),증감률(%),요금증감(원)\n`;
    compRecords.forEach(row => { csvContent += `${row.month},${row.base_val},${row.comp_val},${row.diff},${row.diff_pct},${row.cost}\n`; });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${station}_연도별전력비교_데이터.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleExportBillExcel = () => {
    if (billRecords.length === 0) { alert("다운로드할 요금 데이터가 없습니다."); return; }
    let csvContent = "\uFEFF청구년월,정기검침일,요금적용전력(kW),기본요금(원),전력량요금(원),할인공제계(원),전기요금계(원),청구요금(원),경부하사용량(kWh),중부하사용량(kWh),최대부하사용량(kWh),지상역률(%),진상역률(%)\n";
    billRecords.forEach(row => {
      csvContent += `${row.bill_ym},${row.mr_ymd},${row.bill_aply_pwr},${row.base_bill},${row.kwh_bill},${row.dc_bill},${row.req_bill},${row.req_amt},${row.lload_usekwh},${row.mload_usekwh},${row.maxload_usekwh},${row.ji_pwrfact},${row.jn_pwrfact}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${station}_${billYear}년_전기요금청구내역.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = rawRecords.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(rawRecords.length / rowsPerPage) || 1;

  const Card = ({ children, style = {} }: any) => (
    <div style={{ backgroundColor: theme.surface, borderRadius: theme.radius, padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.border}`, ...style }}>{children}</div>
  );

  const StatCard = ({ title, value, unit, subtitle, subtitleColor = theme.textMuted, topColor }: any) => (
    <div style={{ backgroundColor: theme.surface, borderRadius: theme.radius, padding: '24px', boxShadow: theme.shadow, border: `1px solid ${theme.border}`, borderTop: `4px solid ${topColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>{title}</p>
      <h3 style={{ color: theme.textMain, margin: '12px 0 8px 0', fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>{value} <span style={{ fontSize: '1rem', color: theme.textMuted, fontWeight: 500 }}>{unit}</span></h3>
      {subtitle && <p style={{ color: subtitleColor, margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>{subtitle}</p>}
    </div>
  );

  const getBtnStyle = (itemName: string, isSub: boolean = false) => {
    const isActive = station === itemName;
    return {
      width: '100%', padding: isSub ? '10px 15px 10px 45px' : '12px 20px', backgroundColor: isActive ? theme.primarySoft : 'transparent',
      color: isActive ? theme.primary : (isSub ? theme.textMuted : theme.textMain), border: 'none', borderRadius: '12px', textAlign: 'left' as const,
      fontWeight: isActive ? 700 : 500, cursor: 'pointer', fontSize: isSub ? '13px' : '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', transition: 'all 0.2s ease'
    };
  };

  const getTabStyle = (isActive: boolean) => ({
    padding: '8px 16px', backgroundColor: isActive ? theme.primary : '#F1F5F9', color: isActive ? 'white' : theme.textMuted,
    border: 'none', borderRadius: '24px', cursor: 'pointer', fontWeight: isActive ? 700 : 600, fontSize: '13px', transition: 'all 0.2s ease'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: '"Pretendard", "Malgun Gothic", sans-serif', backgroundColor: theme.bg }}>
      <div style={{ backgroundColor: '#0F172A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>DTRO <span style={{ fontWeight: 400, color: '#94A3B8' }}>데이터센터 프로</span></h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setMainTab('dashboard')} style={{ padding: '8px 16px', backgroundColor: mainTab === 'dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', color: mainTab === 'dashboard' ? '#FFF' : '#94A3B8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>⚡ 통합 대시보드</button>
            <button onClick={() => setMainTab('compare')} style={{ padding: '8px 16px', backgroundColor: mainTab === 'compare' ? 'rgba(255,255,255,0.1)' : 'transparent', color: mainTab === 'compare' ? '#FFF' : '#94A3B8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>📊 연도별 비교</button>
            <button onClick={() => setMainTab('predict')} style={{ padding: '8px 16px', backgroundColor: mainTab === 'predict' ? 'rgba(232, 62, 140, 0.15)' : 'transparent', color: mainTab === 'predict' ? theme.ai : '#94A3B8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>🤖 AI 수요 예측</button>
            <button onClick={() => setMainTab('bill')} style={{ padding: '8px 16px', backgroundColor: mainTab === 'bill' ? 'rgba(25, 128, 56, 0.15)' : 'transparent', color: mainTab === 'bill' ? theme.success : '#94A3B8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>🧾 전기요금</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* 🌟 관리자에게만 보이는 백업 버튼 */}
          {isAdmin && (
            <button onClick={handleMasterBackup} style={{ padding: '8px 16px', backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
              💾 마스터 누적 백업
            </button>
          )}
          
          <div style={{ color: '#94A3B8', fontSize: '12px', marginRight: '10px' }}>
            ID: {userId} {isAdmin ? '(관리자)' : '(일반)'}
          </div>
          <button onClick={() => router.push('/')} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#94A3B8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>로그아웃</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '280px', backgroundColor: theme.surface, borderRight: `1px solid ${theme.border}`, padding: '24px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: 700, paddingLeft: '12px', marginBottom: '16px', textTransform: 'uppercase' }}>대상 개소 선택</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => { toggleMenu('전체'); setStation('전체'); }} style={getBtnStyle('전체')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🏢 전체</span>
              <span style={{ fontSize: '10px', color: theme.textMuted }}>{openMenus['전체'] ? '▼' : '▶'}</span>
            </button>
            {openMenus['전체'] && (
              <div style={{ paddingLeft: '6px', marginTop: '4px', borderLeft: `2px solid ${theme.border}`, marginLeft: '16px', marginBottom: '8px' }}>
                {['1호선', '2호선', '3호선'].map((line) => {
                  const isBillLine1 = mainTab === 'bill' && line === '1호선';
                  const subStations = isBillLine1 ? [] : stationsData[line];
                  const hasSubs = subStations.length > 0;
                  
                  return (
                    <div key={line}>
                      <button onClick={() => { if (hasSubs) toggleMenu(line); setStation(line); }} style={getBtnStyle(line)}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🚆 {line}</span>
                        {hasSubs && <span style={{ fontSize: '10px', color: theme.textMuted }}>{openMenus[line] ? '▼' : '▶'}</span>}
                      </button>
                      {hasSubs && openMenus[line] && subStations.map((sub) => (
                        <button key={sub} onClick={() => setStation(sub)} style={getBtnStyle(sub, true)}>• {sub}</button>
                      ))}
                    </div>
                  );
                })}
                <button onClick={() => setStation('종합청사')} style={getBtnStyle('종합청사')}><span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🏛️ 종합청사</span></button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {/* ===================== [1. 통합 대시보드 탭] ===================== */}
          {mainTab === 'dashboard' && (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>{station} 통합 분석 현황</h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#EFF6FF', color: theme.primary, padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ fontSize: '1rem' }}>📍</span> 연동: {mappedLocation}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.surface, padding: '6px 12px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>기간</span>
                      <input type="date" max={maxDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ border: 'none', outline: 'none', color: theme.textMain, fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent' }} />
                      <span style={{ color: theme.border }}>|</span>
                      <input type="date" max={maxDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ border: 'none', outline: 'none', color: theme.textMain, fontSize: '13px', fontWeight: 500, backgroundColor: 'transparent' }} />
                    </div>
                    <button onClick={() => { fetchDashboardData(); if (chartMode === 'realtime') fetchRealtimeData(); }} style={{ padding: '10px 20px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>데이터 조회</button>
                    <button onClick={handleExportExcel} style={{ padding: '10px 16px', backgroundColor: theme.surface, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', gap: '6px' }}>📊 다운로드</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <StatCard title="누적 전력 사용량" value={loading ? '...' : (summary.total_usage?.toLocaleString() || 0)} unit="kWh" topColor={theme.primary} />
                <StatCard title="최대 수요 전력 (Peak)" value={loading ? '...' : (summary.max_peak?.toLocaleString() || 0)} unit="kW" topColor={theme.danger} />
                <StatCard title="총 예상 탄소배출량" value={loading ? '...' : (summary.total_co2?.toLocaleString() || 0)} unit="tCO2" topColor={theme.success} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h4 style={{ margin: 0, color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>전력 사용량 및 최대수요전력 추이</h4>
                    <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '24px' }}>
                      <button onClick={() => { setChartMode('daily'); fetchDashboardData(); }} style={getTabStyle(chartMode === 'daily')}>일별 추이</button>
                      <button onClick={() => { setChartMode('realtime'); fetchRealtimeData(); }} style={getTabStyle(chartMode === 'realtime')}>🔴 금일 실시간(15분)</button>
                    </div>
                  </div>
                  <div style={{ height: '320px', width: '100%' }}>
                    {chartMode === 'daily' ? (
                      loading ? <p style={{ textAlign: 'center', paddingTop: '120px', color: theme.primary, fontWeight: 700 }}>데이터를 불러오는 중입니다... ⏳</p> : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                            <XAxis dataKey="date" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis yAxisId="left" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow }} />
                            <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: theme.textMuted, paddingTop: '20px' }} iconType="circle" />
                            <Bar yAxisId="left" dataKey="usage_kwh" name="사용량(kWh)" fill={theme.primary} radius={[6, 6, 0, 0]} barSize={28} />
                            <Line yAxisId="right" type="monotone" dataKey="peak_kw" name="최대수요(kW)" stroke={theme.danger} strokeWidth={3} dot={{ r: 4 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      realtimeLoading ? <p style={{ textAlign: 'center', paddingTop: '120px', color: theme.primary, fontWeight: 700 }}>실시간 15분 데이터 연동 중... ⏳</p> : (() => {
                        const currentRealtimeMaxPeak = realtimeData.reduce((max, d) => (d.peak_kw !== null && d.peak_kw > max) ? d.peak_kw : max, -1);
                        const currentMaxPeakTime = realtimeData.find(d => d.peak_kw === currentRealtimeMaxPeak && d.peak_kw !== null)?.time;
                        
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={realtimeData} margin={{ top: 15, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                              <XAxis dataKey="time" tick={{ fill: theme.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} dy={10} minTickGap={20} />
                              <YAxis yAxisId="left" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow }} />
                              <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: theme.textMuted, paddingTop: '20px' }} iconType="circle" />
                              <Bar yAxisId="left" dataKey="usage_kwh" name="사용량(kWh)" fill="#8A3FFC" radius={[4, 4, 0, 0]} barSize={4} />
                              <Line yAxisId="right" type="monotone" dataKey="peak_kw" name="최대수요(kW)" stroke="#FA4D56" strokeWidth={2} dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                if (payload.peak_kw !== null && payload.peak_kw === currentRealtimeMaxPeak && payload.time === currentMaxPeakTime && currentRealtimeMaxPeak > 0) {
                                  return (
                                    <g key={`peak-dot-${payload.time}`}>
                                      <circle cx={cx} cy={cy} r={8} fill="#FA4D56">
                                        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                                      </circle>
                                      <circle cx={cx} cy={cy} r={4} fill="#FFF" />
                                      <text x={cx + 12} y={cy - 12} textAnchor="start" fill="#DA1E28" fontSize="13px" fontWeight="800">
                                        {payload.peak_kw.toLocaleString()} kW
                                      </text>
                                    </g>
                                  );
                                }
                                return null;
                              }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        );
                      })()
                    )}
                  </div>
                </Card>

                <Card style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h4 style={{ margin: 0, color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>기상 및 대기질 지표</h4>
                    <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '24px' }}>
                      <button onClick={() => setWeatherTab('temp')} style={getTabStyle(weatherTab === 'temp')}>기온</button>
                      <button onClick={() => setWeatherTab('humidity')} style={getTabStyle(weatherTab === 'humidity')}>습도</button>
                      <button onClick={() => setWeatherTab('dust')} style={getTabStyle(weatherTab === 'dust')}>초미세먼지</button>
                    </div>
                  </div>
                  <div style={{ height: '320px', width: '100%', flex: 1 }}>
                    {loading ? <p style={{ textAlign: 'center', paddingTop: '120px', color: theme.primary, fontWeight: 700 }}>데이터를 불러오는 중입니다... ⏳</p> : (
                      <ResponsiveContainer width="100%" height="100%">
                        {weatherTab === 'temp' ? (
                          <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                            <XAxis dataKey="date" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{ fill: theme.textMuted, fontSize: 12 }} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow }} />
                            <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '20px' }} iconType="circle" />
                            <Line type="monotone" dataKey="temp_max" name="최고기온(℃)" stroke="#FF832B" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="temp_min" name="최저기온(℃)" stroke="#1192E8" strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        ) : weatherTab === 'humidity' ? (
                          <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                            <XAxis dataKey="date" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{ fill: theme.textMuted, fontSize: 12 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow }} />
                            <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="humidity" name="평균습도(%)" fill="#009D9A" radius={[6, 6, 0, 0]} barSize={28} />
                          </BarChart>
                        ) : (
                          <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                            <XAxis dataKey="date" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow }} />
                            <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '20px' }} iconType="circle" />
                            <Line type="monotone" dataKey="pm25" name="초미세먼지(PM2.5)" stroke="#FA4D56" strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
              </div>

              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}` }}>
                  <h4 style={{ margin: 0, color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>종합 데이터 상세 내역 (일/15분 단위)</h4>
                </div>
                
                <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', color: theme.textMuted, position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>상세</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>항목(일자/시간)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>사용량(kWh)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>최대수요(kW)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>CO2(tCO2)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>최고기온(°C)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>최저기온(°C)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>습도(%)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>초미세먼지(PM2.5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={9} style={{ padding: '60px', color: theme.primary, fontWeight: 700, fontSize: '15px' }}>서버에서 데이터를 갱신하고 있습니다... ⏳</td></tr>
                      ) : currentRows.length === 0 ? (
                        <tr><td colSpan={9} style={{ padding: '40px', color: theme.textMuted }}>데이터가 없습니다. 개소를 선택 후 조회를 실행해주세요.</td></tr>
                      ) : (
                        currentRows.map((row) => (
                          <React.Fragment key={row.date}>
                            <tr style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: expandedRows[row.date] ? '#F8FAFC' : '#FFF' }}>
                              <td style={{ padding: '12px' }}>
                                <button onClick={() => toggleRow(row.date)} style={{ width: '24px', height: '24px', border: `1px solid ${theme.border}`, backgroundColor: '#FFF', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{expandedRows[row.date] ? '-' : '+'}</button>
                              </td>
                              <td style={{ padding: '12px', fontWeight: 700 }}>📁 {row.date}</td>
                              <td style={{ padding: '12px', color: theme.primary, fontWeight: 700 }}>{row.usage_kwh.toLocaleString()}</td>
                              <td style={{ padding: '12px', color: theme.danger, fontWeight: 600 }}>{row.peak_kw.toLocaleString()}</td>
                              <td style={{ padding: '12px', color: theme.textMuted }}>{row.co2}</td>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{row.temp_max !== '--' && row.temp_max !== null ? `${row.temp_max}°` : '--'}</td>
                              <td style={{ padding: '12px', fontWeight: 600, color: '#1192E8' }}>{row.temp_min !== '--' && row.temp_min !== null ? `${row.temp_min}°` : '--'}</td>
                              <td style={{ padding: '12px' }}>{row.humidity !== '--' && row.humidity !== null ? `${row.humidity}%` : '--'}</td>
                              <td style={{ padding: '12px' }}>{row.pm25}</td>
                            </tr>
                            
                            {expandedRows[row.date] && row.details && row.details.map((d: any, idx: number) => (
                              <tr key={`${row.date}-${idx}`} style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: '#F8FAFC' }}>
                                <td style={{ padding: '8px 12px' }}></td>
                                <td style={{ padding: '8px 12px', color: theme.textMuted, fontSize: '13px' }}>↳ {d.time}</td>
                                <td style={{ padding: '8px 12px', color: theme.primary, fontWeight: 700, fontSize: '13px' }}>{d.usage_kwh.toLocaleString()}</td>
                                <td style={{ padding: '8px 12px', color: theme.danger, fontWeight: 600, fontSize: '13px' }}>{d.peak_kw.toLocaleString()}</td>
                                <td style={{ padding: '8px 12px', color: theme.textMuted, fontSize: '13px' }}>{(d.usage_kwh * 0.466 / 1000).toFixed(3)}</td>
                                <td style={{ padding: '8px 12px', color: theme.textMuted, fontSize: '13px' }}>-</td>
                                <td style={{ padding: '8px 12px', color: theme.textMuted, fontSize: '13px' }}>-</td>
                                <td style={{ padding: '8px 12px', color: theme.textMuted, fontSize: '13px' }}>-</td>
                                <td style={{ padding: '8px 12px', color: theme.textMuted, fontSize: '13px' }}>-</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', gap: '16px', backgroundColor: '#F8FAFC', borderTop: `1px solid ${theme.border}` }}>
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: currentPage === 1 ? '#F1F5F9' : '#FFF', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, color: currentPage === 1 ? '#94A3B8' : theme.textMain }}
                    >
                      ◀ 이전
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: theme.textMain }}>
                      {currentPage} <span style={{ color: theme.textMuted, fontWeight: 500 }}>/ {totalPages}</span>
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: currentPage === totalPages ? '#F1F5F9' : '#FFF', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, color: currentPage === totalPages ? '#94A3B8' : theme.textMain }}
                    >
                      다음 ▶
                    </button>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ===================== [2. 연도별 비교 탭] ===================== */}
          {mainTab === 'compare' && (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>{station} 연도별 전력 비교</h2>
                  <p style={{ margin: 0, color: theme.textMuted }}>동일 개소의 과거와 현재 전력 사용량 및 요금을 분석합니다.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  
                  {/* 🌟 관리자 권한 분리: 업로드 버튼 숨김 처리 */}
                  {isAdmin ? (
                    <>
                      <input type="file" accept=".csv, .xlsx" id="compare-upload" style={{ display: 'none' }} onChange={handleFileUpload} />
                      <button onClick={() => document.getElementById('compare-upload')?.click()} style={{ padding: '10px 16px', backgroundColor: '#ECFDF5', color: theme.success, border: `1px solid #A7F3D0`, borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', gap: '6px' }}>
                        📁 통합 데이터셋(백업본 포함) 업로드
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: '10px 16px', backgroundColor: isDatasetReady ? '#ECFDF5' : '#FEF2F2', color: isDatasetReady ? theme.success : theme.danger, borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: `1px solid ${isDatasetReady ? '#A7F3D0' : '#FECACA'}` }}>
                      {isDatasetReady ? `✅ 서버 연동 완료 (${datasetDate})` : '⚠️ 데이터셋 미연동 (관리자 문의)'}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: theme.surface, padding: '6px 16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>기준연도</span>
                      <input type="text" value={baseYear} onChange={(e) => setBaseYear(e.target.value)} style={{ width: '48px', padding: '4px', border: 'none', backgroundColor: '#F1F5F9', borderRadius: '6px', textAlign: 'center', fontWeight: 600, outline: 'none' }} />
                    </div>
                    <span style={{ color: theme.border }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>비교연도</span>
                      <input type="text" value={compYear} onChange={(e) => setCompYear(e.target.value)} style={{ width: '48px', padding: '4px', border: 'none', backgroundColor: '#F1F5F9', borderRadius: '6px', textAlign: 'center', fontWeight: 600, outline: 'none' }} />
                    </div>
                    <span style={{ color: theme.border }}>|</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>단가(원)</span>
                      <input type="text" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} style={{ width: '56px', padding: '4px', border: 'none', backgroundColor: '#F1F5F9', borderRadius: '6px', textAlign: 'center', fontWeight: 600, outline: 'none' }} />
                    </div>
                  </div>
                  <button onClick={fetchCompareData} style={{ padding: '10px 20px', backgroundColor: theme.secondary, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>비교 분석 실행</button>
                  <button onClick={handleExportCompareExcel} style={{ padding: '10px 20px', backgroundColor: theme.surface, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '6px' }}>📊 다운로드</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <StatCard title={`${compYear}년 총 사용량`} value={compLoading ? '...' : (compSummary.total_comp?.toLocaleString() || 0)} unit="kWh" subtitle={compLoading ? '...' : `${baseYear}년(기준): ${compSummary.total_base?.toLocaleString() || 0} kWh`} topColor={theme.secondary} />
                <StatCard title="전력량 증감" value={compLoading ? '...' : `${compSummary.diff > 0 ? '+' : ''}${compSummary.diff?.toLocaleString() || 0}`} unit="kWh" subtitle={compLoading ? '...' : `전년 대비 ${compSummary.diff_pct > 0 ? '+' : ''}${compSummary.diff_pct || 0}%`} subtitleColor={compSummary.diff > 0 ? theme.danger : theme.success} topColor={compSummary.diff > 0 ? theme.danger : theme.success} />
                <StatCard title="예상 전기요금 증감액" value={compLoading ? '...' : `${compSummary.cost > 0 ? '+' : ''}${compSummary.cost?.toLocaleString() || 0}`} unit="원" subtitle={compLoading ? '...' : (compSummary.cost > 0 ? '요금 상승 추정' : '요금 절감 추정')} subtitleColor={compSummary.cost > 0 ? theme.danger : theme.success} topColor={compSummary.cost > 0 ? theme.danger : theme.success} />
              </div>

              <Card style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>월별 전력 사용량 비교 ({baseYear}년 vs {compYear}년)</h4>
                  <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: 600 }}>(단위: MWh)</span>
                </div>
                <div style={{ height: '380px', width: '100%' }}>
                  {compLoading ? <p style={{ textAlign: 'center', paddingTop: '150px', color: theme.secondary, fontWeight: 700 }}>데이터 분석 중... ⏳</p> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compRecords} margin={{ top: 5, right: 0, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                        <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 13 }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tickFormatter={(val) => (val / 1000).toLocaleString()} tick={{ fill: theme.textMuted, fontSize: 13 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow, fontWeight: 600 }} formatter={(val, name) => [`${(Number(val) / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh`, name]} />
                        <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: theme.textMuted, paddingTop: '20px' }} iconType="circle" />
                        <Bar dataKey="base_val" name={`${baseYear}년 (기준)`} fill="#94A3B8" radius={[6, 6, 0, 0]} barSize={32} />
                        <Bar dataKey="comp_val" name={`${compYear}년 (비교)`} fill={theme.secondary} radius={[6, 6, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              <Card style={{ padding: '0', overflow: 'hidden', marginBottom: '32px' }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}` }}>
                  <h4 style={{ margin: 0, color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>월별 비교 상세 데이터</h4>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', color: theme.textMuted }}>
                      <tr>
                        <th style={{ padding: '16px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>월별</th>
                        <th style={{ padding: '16px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>기준연도 (kWh)</th>
                        <th style={{ padding: '16px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>비교연도 (kWh)</th>
                        <th style={{ padding: '16px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>증감량 (kWh)</th>
                        <th style={{ padding: '16px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>증감률 (%)</th>
                        <th style={{ padding: '16px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>요금 증감 (원)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compLoading ? (
                        <tr><td colSpan={6} style={{ padding: '60px', color: theme.secondary, fontWeight: 700, fontSize: '15px' }}>과거 데이터와 비교 연산을 수행하고 있습니다... ⏳</td></tr>
                      ) : compRecords.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding: '40px', color: theme.textMuted }}>개소를 선택 후 비교 분석을 실행해 주세요.</td></tr>
                      ) : (
                        compRecords.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <td style={{ padding: '16px', fontWeight: 700, color: theme.textMain }}>{row.month}</td>
                            <td style={{ padding: '16px', color: theme.textMuted, fontWeight: 500 }}>{row.base_val.toLocaleString()}</td>
                            <td style={{ padding: '16px', color: theme.secondary, fontWeight: 700 }}>{row.comp_val.toLocaleString()}</td>
                            <td style={{ padding: '16px', fontWeight: 600, color: row.diff > 0 ? theme.danger : theme.success }}><span style={{ backgroundColor: row.diff > 0 ? '#FEF2F2' : '#ECFDF5', padding: '4px 10px', borderRadius: '20px' }}>{row.diff > 0 ? '+' : ''}{row.diff.toLocaleString()}</span></td>
                            <td style={{ padding: '16px', fontWeight: 700, color: row.diff_pct > 0 ? theme.danger : theme.success }}>{row.diff_pct > 0 ? '+' : ''}{row.diff_pct}%</td>
                            <td style={{ padding: '16px', fontWeight: 600, color: row.cost > 0 ? theme.danger : theme.success }}>{row.cost > 0 ? '+' : ''}{row.cost.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card style={{ padding: '0', overflow: 'hidden', border: `1px solid ${theme.primary}` }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}`, backgroundColor: '#F8FAFC' }}>
                  <h4 style={{ margin: 0, color: theme.primary, fontSize: '1.1rem', fontWeight: 700 }}>💡 XGBoost 증감 요인 심층 분석 리포트</h4>
                </div>
                <div style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                  {compLoading ? (
                    <p style={{ color: theme.secondary, fontWeight: 700 }}>AI가 데이터를 분석하고 있습니다... ⏳</p>
                  ) : aiReport ? (
                    <>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: theme.textMain, fontSize: '15px', lineHeight: '1.7', margin: 0, fontWeight: 500 }}>{aiReport}</pre>
                    </>
                  ) : <p style={{ color: theme.textMuted, fontWeight: 500 }}>비교 분석을 실행해 주세요.</p>}
                </div>
              </Card>
            </div>
          )}

          {/* ===================== [3. AI 수요 예측 탭] ===================== */}
          {mainTab === 'predict' && (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>{station} AI 전력 수요 예측</h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(232, 62, 140, 0.1)', color: theme.ai, padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ fontSize: '1rem' }}>🧠</span> XGBoost Regressor 기반 초정밀 예측 모델
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.surface, padding: '6px 12px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>타겟 연도</span>
                    <input type="text" value={targetYear} onChange={(e) => setTargetYear(e.target.value)} style={{ width: '50px', border: 'none', outline: 'none', color: theme.textMain, fontSize: '14px', fontWeight: 700, backgroundColor: '#F1F5F9', borderRadius: '6px', textAlign: 'center' }} />
                  </div>
                  
                  {/* 🌟 관리자 권한 분리 */}
                  {isAdmin ? (
                    <>
                      <input type="file" accept=".csv, .xlsx" id="predict-upload" style={{ display: 'none' }} onChange={handleFileUpload} />
                      <button onClick={() => document.getElementById('predict-upload')?.click()} style={{ padding: '10px 16px', backgroundColor: '#ECFDF5', color: theme.success, border: `1px solid #A7F3D0`, borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', gap: '6px' }}>
                        📁 통합 데이터셋(백업본 포함) 업로드
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: '10px 16px', backgroundColor: isDatasetReady ? '#ECFDF5' : '#FEF2F2', color: isDatasetReady ? theme.success : theme.danger, borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: `1px solid ${isDatasetReady ? '#A7F3D0' : '#FECACA'}` }}>
                      {isDatasetReady ? `✅ 서버 연동 완료 (${datasetDate})` : '⚠️ 데이터셋 미연동'}
                    </div>
                  )}

                  <button onClick={runAIPrediction} disabled={predLoading} style={{ padding: '10px 24px', backgroundColor: theme.ai, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px', opacity: predLoading ? 0.7 : 1 }}>
                    {predLoading ? '분석 중...' : 'AI 예측 실행'}
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: theme.surface, padding: '16px 24px', borderRadius: theme.radius, border: `1px solid ${theme.border}`, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: theme.textMain }}>🔮 시뮬레이션 변수 조정</span>
                <div style={{ width: '1px', height: '24px', backgroundColor: theme.border }}></div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>승객수(%)</span>
                  <input type="text" value={passRate} onChange={(e) => setPassRate(e.target.value)} style={{ width: '50px', padding: '6px', border: `1px solid ${theme.border}`, borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>여름(±°C)</span>
                  <input type="text" value={tempAdj} onChange={(e) => setTempAdj(e.target.value)} style={{ width: '50px', padding: '6px', border: `1px solid ${theme.border}`, borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>겨울(±°C)</span>
                  <input type="text" value={winterTempAdj} onChange={(e) => setWinterTempAdj(e.target.value)} style={{ width: '50px', padding: '6px', border: `1px solid ${theme.border}`, borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>PM2.5 나쁨(±일)</span>
                  <input type="text" value={pm25Adj} onChange={(e) => setPm25Adj(e.target.value)} style={{ width: '50px', padding: '6px', border: `1px solid ${theme.border}`, borderRadius: '6px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }} />
                </div>
              </div>

              {predSummary && !predLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                  <StatCard 
                    title="예상 연간 총 전력량" 
                    value={predSummary.tot_future.toLocaleString()} 
                    unit="kWh" 
                    subtitle={`직전 연도(${Number(targetYear)-1}년) 대비 ${predSummary.tot_future > predSummary.last_tot ? '+' : ''}${(predSummary.tot_future - predSummary.last_tot).toLocaleString()} kWh 증감`} 
                    subtitleColor={predSummary.tot_future > predSummary.last_tot ? theme.danger : theme.success} 
                    topColor={theme.ai} 
                  />
                  <StatCard 
                    title="예상 연간 최대 수요 (Peak)" 
                    value={predSummary.peak_future.toLocaleString()} 
                    unit="kW" 
                    subtitle={`직전 연도(${Number(targetYear)-1}년) 대비 ${predSummary.peak_future > predSummary.last_peak ? '+' : ''}${(predSummary.peak_future - predSummary.last_peak).toLocaleString()} kW 증감`} 
                    subtitleColor={predSummary.peak_future > predSummary.last_peak ? theme.danger : theme.success} 
                    topColor={theme.danger} 
                  />
                  <StatCard 
                    title="AI 모델 검증 (학습 R² Score)" 
                    value={predSummary.acc} 
                    unit="%" 
                    subtitle="XGBoost Regressor 알고리즘 적용" 
                    subtitleColor={theme.textMuted} 
                    topColor="#10B981" 
                  />
                </div>
              )}

              {predLoading ? (
                <div style={{ backgroundColor: theme.surface, borderRadius: theme.radius, padding: '80px 20px', textAlign: 'center', border: `1px dashed ${theme.border}` }}>
                  <span style={{ fontSize: '3rem' }}>⏳</span>
                  <h3 style={{ color: theme.ai, marginTop: '16px', marginBottom: '8px' }}>AI가 수십만 건의 데이터를 학습하여 예측 중입니다...</h3>
                  <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.95rem' }}>잠시만 기다려주세요.</p>
                </div>
              ) : predChartData.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 24px 0', color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>{targetYear}년 월별 전력 수요 예측 추이</h4>
                      <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: 600 }}>(단위: MWh)</span>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={predChartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                          <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 13 }} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tickFormatter={(val) => (val / 1000).toLocaleString()} tick={{ fill: theme.textMuted, fontSize: 13 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow, fontWeight: 600 }} formatter={(val, name) => [`${(Number(val) / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh`, name]} />
                          <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600, paddingTop: '20px' }} />
                          <Line type="monotone" dataKey="past_kwh" name="직전연도 실측치" stroke="#94A3B8" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="pred_kwh" name={`${targetYear}년 AI 예측치`} stroke={theme.ai} strokeWidth={4} strokeDasharray="5 5" dot={{ r: 6, fill: '#FFF', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  
                  <Card>
                    <h4 style={{ margin: '0 0 24px 0', color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>예측 변수 중요도</h4>
                    <div style={{ height: '350px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={featChartData} margin={{ top: 5, right: 30, left: 70, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.border} />
                          <XAxis type="number" tick={{ fill: theme.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fill: theme.textMain, fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: theme.shadow, fontWeight: 600 }} formatter={(val) => val + '%'} />
                          <Bar dataKey="value" name="중요도(%)" fill={theme.secondary} radius={[0, 6, 6, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              ) : (
                <div style={{ backgroundColor: theme.surface, borderRadius: theme.radius, padding: '80px 20px', textAlign: 'center', border: `1px dashed ${theme.border}` }}>
                  <span style={{ fontSize: '3rem' }}>📁</span>
                  <h3 style={{ color: theme.textMain, marginTop: '16px', marginBottom: '8px' }}>데이터를 기다리고 있습니다</h3>
                  <p style={{ color: theme.textMuted, margin: 0, fontSize: '0.95rem' }}>서버에 연동된 데이터셋이 있다면 우측 상단의 <b>[AI 예측 실행]</b> 버튼을 눌러보세요.</p>
                </div>
              )}
            </div>
          )}

          {/* ===================== [4. 전기요금 탭] ===================== */}
          {mainTab === 'bill' && (
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                  <h2 style={{ color: theme.textMain, margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800 }}>{station} 전기요금 청구 내역</h2>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#F3F4F6', color: theme.textMain, padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ fontSize: '1rem' }}>🧾</span> 한전 고객번호: {billCustNo || '조회 전'} 
                    {station === '1호선' && <span style={{ color: theme.danger, marginLeft: '8px' }}>(※ 1호선은 전 역사 모수용 통합 청구 기준)</span>}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.surface, padding: '6px 12px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                    <span style={{ color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>조회 연도</span>
                    <input type="text" value={billYear} onChange={(e) => setBillYear(e.target.value)} style={{ width: '50px', border: 'none', outline: 'none', color: theme.textMain, fontSize: '14px', fontWeight: 700, backgroundColor: '#F1F5F9', borderRadius: '6px', textAlign: 'center' }} />
                  </div>
                  <button onClick={fetchBillData} style={{ padding: '10px 20px', backgroundColor: theme.success, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>요금 조회</button>
                  <button onClick={handleExportBillExcel} style={{ padding: '10px 20px', backgroundColor: theme.surface, color: theme.textMain, border: `1px solid ${theme.border}`, borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', gap: '6px' }}>📊 엑셀 다운로드</button>
                </div>
              </div>

              <Card style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}` }}>
                  <h4 style={{ margin: 0, color: theme.textMain, fontSize: '1.1rem', fontWeight: 700 }}>월별 상세 요금 청구서 ({billYear}년)</h4>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    <thead style={{ backgroundColor: '#F8FAFC', color: theme.textMuted }}>
                      <tr>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>청구년월</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>검침일</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>적용전력(kW)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>기본요금(원)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>전력량요금(원)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>할인공제(원)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>요금계(원)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}`, backgroundColor: '#EFF6FF', color: theme.primary }}>청구요금(원)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>경부하(kWh)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>중부하(kWh)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>최대부하(kWh)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>지상역률(%)</th>
                        <th style={{ padding: '16px 12px', fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>진상역률(%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billLoading ? (
                        <tr><td colSpan={13} style={{ padding: '60px', color: theme.success, fontWeight: 700, fontSize: '15px' }}>한전 서버에서 청구 데이터를 수집 중입니다... ⏳</td></tr>
                      ) : billRecords.length === 0 ? (
                        <tr><td colSpan={13} style={{ padding: '60px', color: theme.textMuted }}>조회된 전기요금 청구 내역이 없습니다. (조회 연도와 대상 개소를 확인해주세요)</td></tr>
                      ) : (
                        billRecords.map((row: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: '#FFF' }}>
                            <td style={{ padding: '12px', fontWeight: 700 }}>{row.bill_ym?.replace(/(\d{4})(\d{2})/, '$1-$2')}</td>
                            <td style={{ padding: '12px' }}>{row.mr_ymd}일</td>
                            <td style={{ padding: '12px' }}>{Number(row.bill_aply_pwr || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{Number(row.base_bill || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{Number(row.kwh_bill || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px', color: theme.success }}>{Number(row.dc_bill || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{Number(row.req_bill || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px', fontWeight: 800, color: theme.primary, backgroundColor: '#FAFAFA' }}>{Number(row.req_amt || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px', color: theme.textMuted }}>{Number(row.lload_usekwh || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px', color: theme.textMuted }}>{Number(row.mload_usekwh || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px', color: theme.textMuted }}>{Number(row.maxload_usekwh || 0).toLocaleString()}</td>
                            <td style={{ padding: '12px' }}>{row.ji_pwrfact}</td>
                            <td style={{ padding: '12px' }}>{row.jn_pwrfact}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}