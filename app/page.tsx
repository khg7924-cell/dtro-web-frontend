'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebase'; // firebase.js 위치에 맞게 경로 조절 필요
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set, get, child } from 'firebase/database';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [userId, setUserId] = useState(''); 
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(''); 

  const formatEmail = (id: string) => `${id}@dtro.local`;

  // 🟢 로그인 처리 로직
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim() === '' || password.trim() === '') {
      alert('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formatEmail(userId), password);
      const user = userCredential.user;

      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${user.uid}`));
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.isApproved === true) {
          
          localStorage.setItem('userId', userId);
          router.push('/dashboard'); 
        } else {
          await signOut(auth); 
          alert('관리자 승인 대기 중입니다. 관리자에게 문의하세요.');
        }
      } else {
        await signOut(auth);
        alert('사용자 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해 주세요.');
    }
  };

  // 🔵 회원가입 처리 로직
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim() === '' || password.trim() === '' || department.trim() === '') {
      alert('모든 정보를 입력해 주세요.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formatEmail(userId), password);
      const user = userCredential.user;

      await set(ref(db, 'users/' + user.uid), {
        empId: userId,
        department: department, 
        isApproved: false 
      });

      await signOut(auth);
      
      alert('계정 등록 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
      setDepartment(''); 
      setPassword('');
      setIsLoginMode(true);
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        alert('이미 사용 중인 아이디입니다.');
      } else {
        alert('계정 등록 신청 중 오류가 발생했습니다. (' + error.message + ')');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Pretendard", "Malgun Gothic", sans-serif', backgroundColor: '#F8FAFC' }}>
      
      {/* 왼쪽: 브랜드 및 안내 영역 */}
      <div style={{ flex: 1, backgroundColor: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          
          {/* 🌟 폰트 사이즈 및 여백 대폭 확대 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '48px' }}>
            <h1 style={{ margin: 0, fontSize: '3.8rem', fontFamily: 'sans-serif', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 900, color: '#0F62FE' }}>DTRO</span>
              <span style={{ fontWeight: 300, color: '#FFFFFF' }}> 스마트 에너지 관리 시스템</span>
            </h1>
            <div style={{ fontSize: '1.4rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.5px' }}>
              <span style={{ fontWeight: 800, letterSpacing: '2px' }}>SEMS</span> 
              <span style={{ color: '#475569', fontWeight: 400, marginLeft: '10px' }}>| Smart Energy Management System</span>
            </div>
          </div>

          <p style={{ fontSize: '1.25rem', color: '#94A3B8', margin: '0 0 40px 0', lineHeight: 1.6 }}>
            대구교통공사 빅데이터 통합 관제 플랫폼<br />
            기상, 대기질, 전력 데이터를 AI로 정밀 분석합니다.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 600 }}>⚡ 실시간 전력 분석</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 600 }}>🌤️ 기상청/대기질 연동</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '24px', fontSize: '0.9rem', fontWeight: 600 }}>🤖 AI 전력 수요 예측</span>
          </div>
        </div>
        
        {/* 장식용 배경 원 */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', backgroundColor: '#0F62FE', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, zIndex: 1 }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', backgroundColor: '#8A3FFC', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, zIndex: 1 }}></div>
      </div>

      {/* 오른쪽: 입력 폼 영역 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '48px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)', width: '100%', maxWidth: '440px', border: '1px solid #E2E8F0' }}>
          
          <h2 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '1.8rem', fontWeight: 800 }}>
            {isLoginMode ? '계정 로그인' : '계정 등록 신청'}
          </h2>
          <p style={{ margin: '0 0 32px 0', color: '#64748B', fontSize: '0.95rem' }}>
            {isLoginMode 
              ? '접근 권한이 있는 사내 계정을 입력해 주세요.' 
              : '가입 신청 후 관리자의 승인이 완료되어야 로그인이 가능합니다.'}
          </p>
          
          <form onSubmit={isLoginMode ? handleLogin : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {!isLoginMode && (
              <div>
                <label style={{ display: 'block', margin: '0 0 8px 0', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>소속</label>
                <input 
                  type="text" 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)} 
                  placeholder="예 : 전기관리팀"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '1rem', backgroundColor: '#F8FAFC', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', margin: '0 0 8px 0', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>아이디</label>
              <input 
                type="text" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
                placeholder={isLoginMode ? "아이디 입력" : "사용할 사번/아이디 입력"}
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
              style={{ width: '100%', padding: '16px', marginTop: '12px', backgroundColor: isLoginMode ? '#0F62FE' : '#8A3FFC', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            >
              {isLoginMode ? '로그인' : '계정 등록 신청'}
            </button>
          </form>
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            {isLoginMode ? (
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
                계정이 없으신가요?{' '}
                <span 
                  onClick={() => setIsLoginMode(false)}
                  style={{ color: '#0F62FE', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  계정 등록 신청
                </span>
              </p>
            ) : (
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
                이미 승인된 계정이 있으신가요?{' '}
                <span 
                  onClick={() => setIsLoginMode(true)}
                  style={{ color: '#0F62FE', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  계정 로그인
                </span>
              </p>
            )}
          </div>

        </div>
      </div>
      
    </div>
  );
}