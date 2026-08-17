'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [userPw, setUserPw] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 🚀 파이썬 백엔드(8080 포트)로 로그인 요청
      const response = await fetch('http://127.0.0.1:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_pw: userPw }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        router.push('/dashboard'); // 성공 시 대시보드로 이동
      } else {
        alert(data.detail || '로그인에 실패했습니다.');
      }
    } catch (error) {
      alert('파이썬 서버와 통신할 수 없습니다. (파이썬 서버가 켜져 있는지 확인하세요)');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Malgun Gothic, sans-serif' }}>
      <div style={{ flex: 1, backgroundColor: '#005BAA', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontSize: '4rem', margin: 0, fontWeight: 'bold' }}>DTRO</h1>
        <h2 style={{ color: '#00A651', marginTop: '10px' }}>대구교통공사</h2>
        <p style={{ color: '#E0E0E0' }}>기상·전력 통합 데이터센터</p>
      </div>

      <div style={{ flex: 1, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10%' }}>
        <h2 style={{ color: '#333333', fontSize: '2rem', marginBottom: '10px' }}>관리자 로그인</h2>
        <p style={{ color: '#888888', marginBottom: '40px' }}>시스템 접근을 위해 로그인해 주세요.</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="text" placeholder="아이디 (사번)" value={userId} onChange={(e) => setUserId(e.target.value)} required style={{ padding: '12px', border: '1px solid #DDDDDD', borderRadius: '4px', fontSize: '16px', color: '#333' }} />
          <input type="password" placeholder="비밀번호" value={userPw} onChange={(e) => setUserPw(e.target.value)} required style={{ padding: '12px', border: '1px solid #DDDDDD', borderRadius: '4px', fontSize: '16px', color: '#333' }} />
          <button type="submit" style={{ padding: '15px', backgroundColor: '#005BAA', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>로그인</button>
        </form>
      </div>
    </div>
  );
}