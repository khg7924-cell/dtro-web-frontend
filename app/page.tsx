'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 아이디나 비밀번호가 입력되었는지 간단히 체크
    if (empId.trim() === '' || password.trim() === '') {
      alert('사원번호와 비밀번호를 입력해 주세요.');
      return;
    }

    // 로그인 성공 시 대시보드로 이동
    router.push('/dashboard');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Pretendard", "Malgun Gothic", sans-serif', backgroundColor: '#F8FAFC' }}>
      
      {/* 왼쪽: 브랜드 및 안내 영역 */}
      <div style={{ flex: 1, backgroundColor: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-1px' }}>DTRO 데이터센터 프로</h1>
          <p style={{ fontSize: '1.2rem', color: '#94A3B8', margin: '0 0 40px 0', lineHeight: 1.6 }}>
            대구교통공사 빅데이터 통합 관제 플랫폼<br />
            기상, 대기질, 전력 데이터를 AI로 정밀 분석합니다.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>⚡ 실시간 전력 분석</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>🌤️ 기상청/대기질 연동</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>🤖 AI 전력 수요 예측</span>
          </div>
        </div>
        
        {/* 장식용 배경 원 */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', backgroundColor: '#0F62FE', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, zIndex: 1 }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', backgroundColor: '#8A3FFC', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, zIndex: 1 }}></div>
      </div>

      {/* 오른쪽: 로그인 폼 영역 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '48px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', width: '100%', maxWidth: '440px', border: '1px solid #E2E8F0' }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.8rem', fontWeight: 800 }}>관리자 로그인</h2>
          <p style={{ margin: '0 0 32px 0', color: '#64748B', fontSize: '0.95rem' }}>접근 권한이 있는 사원번호를 입력해 주세요.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', margin: '0 0 8px 0', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>사원번호</label>
              <input 
                type="text" 
                value={empId} 
                onChange={(e) => setEmpId(e.target.value)} 
                placeholder="사원번호 입력"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '1rem', backgroundColor: '#F8FAFC', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', margin: '0 0 8px 0', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>비밀번호</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="비밀번호 입력"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '1rem', backgroundColor: '#F8FAFC', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              />
            </div>
            
            <button 
              type="submit" 
              style={{ width: '100%', padding: '16px', marginTop: '12px', backgroundColor: '#0F62FE', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(15, 98, 254, 0.25)' }}
            >
              로그인
            </button>
          </form>
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
              보안 문제가 발생했거나 계정을 분실하신 경우<br />시스템 관리자에게 문의하세요.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}