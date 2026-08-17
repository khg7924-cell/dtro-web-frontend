'use client';

import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Malgun Gothic, sans-serif', backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, color: '#005BAA' }}>⚡ 통합 기상/전력 대시보드</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>로그아웃</button>
      </div>
      
      <div style={{ marginTop: '30px', padding: '40px', backgroundColor: '#FFFFFF', borderRadius: '8px', textAlign: 'center' }}>
        <h2 style={{ color: '#6B7280' }}>로그인 성공! 🎉</h2>
        <p style={{ color: '#333' }}>파이썬 백엔드와의 통신 연결 테스트가 완료되었습니다.</p>
        <p style={{ color: '#333' }}>이곳에 2025년과 2026년의 전력 수요 예측 데이터가 연결될 예정입니다.</p>
      </div>
    </div>
  );
}