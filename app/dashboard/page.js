'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import MedKarta from '../../components/MedKarta';

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      setSession(session);
      // Load profile with error handling — 406 fix
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.warn('Profile load error:', error.message);
            // Fallback profile from auth user metadata
            setProfile({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
              role: 'admin',
            });
          } else if (!data) {
            // Profile doesn't exist yet — create one
            console.log('No profile found, using defaults');
            setProfile({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || '',
              role: 'admin',
            });
          } else {
            setProfile(data);
          }
          setLoading(false);
        })
        .catch(() => {
          // Complete fallback
          setProfile({
            id: session.user.id,
            email: session.user.email,
            full_name: '',
            role: 'admin',
          });
          setLoading(false);
        });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:18,color:'#64748b',fontFamily:"'DM Sans',sans-serif"}}>
        ⏳ Загрузка...
      </div>
    );
  }

  return <MedKarta supabase={supabase} session={session} profile={profile} />;
}
