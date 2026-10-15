<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './supabase'
import Auth from './components/Auth.vue'
import DashboardMedico from './components/DashboardMedico.vue'

const session = ref(null)
const userProfile = ref(null)

onMounted(async () => {
  const { data: { session: currentSession } } = await supabase.auth.getSession()
  session.value = currentSession
  if (currentSession) fetchUserProfile(currentSession.user.id)

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
    if (_session) {
      fetchUserProfile(_session.user.id)
    } else {
      userProfile.value = null
    }
  })
})

const fetchUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('integra_medicos_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      
    if (!error && data) {
      userProfile.value = data
    } else {
      // Perfil base para evitar ecrã em branco caso a tabela demore
      userProfile.value = {
        id: userId,
        full_name: 'Dr. Lucas Castro',
        crm: 'CRM/CE 000000',
        specialty: 'Clínico Geral'
      }
    }
  } catch (e) {
    userProfile.value = {
      id: userId,
      full_name: 'Dr. Lucas Castro',
      crm: 'CRM/CE 000000',
      specialty: 'Clínico Geral'
    }
  }
}

const logout = async () => {
  await supabase.auth.signOut()
}
</script>

<template>
  <Auth v-if="!session" />
  <div v-else class="min-h-screen bg-[#F4F7FC] flex flex-col justify-between font-sans">
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-[#0B2545] rounded-2xl flex items-center justify-center text-white">
          <i class="fa-solid fa-user-doctor text-[#FF6B00]"></i>
        </div>
        <div>
          <h1 class="font-extrabold text-[#0B2545] text-sm">Integra + Médicos</h1>
          <p class="text-[11px] text-gray-500 font-medium" v-if="userProfile">
            {{ userProfile.full_name }} — <span class="text-[#FF6B00] font-bold">{{ userProfile.crm }}</span>
          </p>
        </div>
      </div>
      <button @click="logout" class="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-semibold px-4 py-2 rounded-xl transition">
        <i class="fa-solid fa-right-from-bracket mr-1"></i> Sair
      </button>
    </header>

    <main class="flex-grow w-full">
      <DashboardMedico v-if="userProfile" :userProfile="userProfile" />
    </main>

    <footer class="bg-[#0B2545] text-white py-6 text-center text-xs">
      <p>Integra + Médicos — Cuidado que transforma.</p>
    </footer>
  </div>
</template>