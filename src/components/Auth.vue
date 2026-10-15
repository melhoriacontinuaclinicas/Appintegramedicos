<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'

const email = ref('')
const senha = ref('')
const nomeCompleto = ref('')
const crm = ref('')
const especialidade = ref('')
const modo = ref('login') // 'login', 'registar', 'esqueci'
const aCarregar = ref(false)
const mensagemErro = ref('')
const mensagemSucesso = ref('')

const lidarAutenticacao = async () => {
  aCarregar.value = true
  mensagemErro.value = ''
  mensagemSucesso.value = ''
  
  try {
    if (modo.value === 'registar') {
      const { data: crmExistente } = await supabase
        .from('integra_medicos_profiles')
        .select('crm')
        .eq('crm', crm.value.trim())
        .maybeSingle()

      if (crmExistente) {
        throw new Error('Este CRM já se encontra registado no sistema.')
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.value.trim(),
        password: senha.value,
      })
      if (authError) throw authError

      if (data.user) {
        const { error: profileError } = await supabase.from('integra_medicos_profiles').insert([
          {
            id: data.user.id,
            full_name: nomeCompleto.value.trim(),
            crm: crm.value.trim(),
            specialty: especialidade.value.trim(),
            role: 'medico'
          }
        ])
        if (profileError) throw profileError
      }
      
      mensagemSucesso.value = 'Conta criada com sucesso! Faça login para aceder.'
      modo.value = 'login'
      senha.value = ''
    } 
    else if (modo.value === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value.trim(),
        password: senha.value,
      })
      if (error) throw error
    } 
    else if (modo.value === 'esqueci') {
      if (!email.value.trim()) {
        throw new Error('Por favor, insira o seu e-mail profissional.')
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
        redirectTo: window.location.origin,
      })
      if (error) throw error
      mensagemSucesso.value = 'Instruções de recuperação enviadas para o seu e-mail.'
    }
  } catch (erro) {
    mensagemErro.value = erro.message || 'Ocorreu um erro durante a operação.'
  } finally {
    aCarregar.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper min-h-screen w-full bg-[#040B16] flex flex-col justify-between font-sans antialiased text-gray-800 overflow-x-hidden relative">
    
    <!-- LUZES DE FUNDO GIGANTES E DE ALTA INTENSIDADE -->
    <div class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div class="luz-orbe bg-[#FF6B00]/40 w-[650px] h-[650px] top-[10%] left-[10%] animate-flutuar-1"></div>
      <div class="luz-orbe bg-blue-500/40 w-[750px] h-[750px] bottom-[10%] right-[10%] animate-flutuar-2"></div>
      <div class="luz-orbe bg-emerald-500/30 w-[550px] h-[550px] top-[40%] right-[30%] animate-flutuar-3"></div>
      
      <!-- BOLINHAS / PARTÍCULAS BRILHANTES A FLUTUAR -->
      <div class="particula bg-[#FF6B00] w-4 h-4 top-[20%] left-[30%] animate-particula-1"></div>
      <div class="particula bg-blue-400 w-6 h-6 top-[70%] left-[20%] animate-particula-2"></div>
      <div class="particula bg-emerald-400 w-5 h-5 top-[40%] left-[80%] animate-particula-3"></div>
      <div class="particula bg-white w-3 h-3 top-[80%] left-[75%] animate-particula-1"></div>
      <div class="particula bg-[#FF6B00] w-5 h-5 top-[15%] left-[85%] animate-particula-2"></div>

      <div class="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
    </div>

    <!-- Conteúdo Principal -->
    <header class="relative z-10 flex-grow flex items-center justify-center w-full py-16 px-4">
      <div class="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        
        <div class="flex flex-col items-center justify-center space-y-3 w-full">
          <div class="w-16 h-16 bg-gradient-to-br from-[#0B2545] to-[#13396b] rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-[#FF6B00]/40 border border-white/20">
            <i class="fa-solid fa-user-doctor text-3xl text-[#FF6B00]"></i>
          </div>
          <div class="flex items-center justify-center space-x-1">
            <span class="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">Integra</span>
            <span class="text-3xl lg:text-4xl font-extrabold text-[#FF6B00] animate-pulse">+</span>
            <span class="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">MÉDICOS</span>
          </div>
        </div>

        <div class="inline-block bg-white/10 backdrop-blur-md text-white text-[11px] font-extrabold px-5 py-2 rounded-full uppercase tracking-wider shadow border border-white/10">
          TRILHA DE FORMAÇÃO MÉDICA DE CLÍNICAS
        </div>

        <div class="space-y-2 max-w-xl mx-auto flex flex-col items-center text-center">
          <h2 class="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
            Conhecimento que integra. Cuidado que transforma.
          </h2>
          <p class="text-xs sm:text-sm text-gray-300 leading-relaxed font-medium">
            Programa <span class="text-[#FF6B00] font-bold">obrigatório</span> de capacitação para nossos parceiros médicos. Complete os módulos disponíveis e fortaleça seus conhecimentos para uma atuação segura.
          </p>
        </div>

        <!-- Card de Acesso -->
        <div class="bg-white/95 backdrop-blur-xl w-full max-w-md mx-auto rounded-3xl shadow-2xl border border-white/20 p-8 space-y-5 relative overflow-hidden text-left mt-2">
          <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2545] to-[#FF6B00]"></div>

          <h3 class="text-xl font-extrabold text-[#0B2545] text-center">
            {{ modo === 'esqueci' ? 'Recuperar Acesso' : (modo === 'registar' ? 'Registo de Médico' : 'Acesso ao Portal') }}
          </h3>

          <div v-if="mensagemErro" class="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-semibold border border-red-200">
            {{ mensagemErro }}
          </div>
          <div v-if="mensagemSucesso" class="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl text-xs font-semibold border border-emerald-200">
            {{ mensagemSucesso }}
          </div>

          <form @submit.prevent="lidarAutenticacao" class="space-y-4">
            <template v-if="modo === 'registar'">
              <div>
                <label class="block text-[10px] font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
                <input v-model="nomeCompleto" type="text" required placeholder="Dr. Nome Sobrenome" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] transition">
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-gray-700 uppercase mb-1">CRM</label>
                  <input v-model="crm" type="text" required placeholder="CRM/UF 000000" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] transition">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-gray-700 uppercase mb-1">Especialidade</label>
                  <input v-model="especialidade" type="text" required placeholder="Clínico Geral" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] transition">
                </div>
              </div>
            </template>

            <div>
              <label class="block text-[10px] font-bold text-gray-700 uppercase mb-1">E-mail Profissional</label>
              <input v-model="email" type="email" required placeholder="medico@hospital.com" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] transition">
            </div>

            <div v-if="modo !== 'esqueci'">
              <div class="flex justify-between items-center mb-1">
                <label class="text-[10px] font-bold text-gray-700 uppercase">Senha</label>
                <button v-if="modo === 'login'" type="button" @click="modo = 'esqueci'; mensagemErro = ''; mensagemSucesso = ''" class="text-[11px] text-[#FF6B00] hover:underline font-semibold">
                  Esqueceu a senha?
                </button>
              </div>
              <input v-model="senha" type="password" required placeholder="••••••••" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#FF6B00] transition">
            </div>

            <div class="pt-2 space-y-3">
              <button type="submit" :disabled="aCarregar" class="w-full bg-[#FF6B00] hover:bg-[#D95A00] text-white font-bold py-3.5 px-6 rounded-2xl text-xs transition-all shadow-lg shadow-[#FF6B00]/40 uppercase tracking-wider text-center">
                {{ aCarregar ? 'A processar...' : (modo === 'registar' ? 'Criar Conta' : (modo === 'esqueci' ? 'Enviar' : 'Vamos Começar')) }}
              </button>
              
              <div class="text-center pt-1">
                <button type="button" @click="modo = modo === 'registar' ? 'login' : 'registar'; mensagemErro = ''; mensagemSucesso = ''" class="text-xs text-gray-700 hover:text-[#FF6B00] font-bold transition">
                  {{ modo === 'registar' ? 'Já tem conta? Fazer login' : 'Primeiro acesso? Registe-se aqui' }}
                </button>
              </div>
            </div>

            <div v-if="modo === 'esqueci'" class="text-center pt-1">
              <button type="button" @click="modo = 'login'; mensagemErro = ''; mensagemSucesso = ''" class="text-xs text-gray-500 hover:text-[#FF6B00] font-semibold">
                Voltar ao login
              </button>
            </div>
          </form>
        </div>

      </div>
    </header>

    <!-- Rodapé -->
    <footer class="bg-[#02060D] text-white border-t border-white/10 py-5 px-6 w-full z-10">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-3 md:space-y-0 text-xs">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-[#FF6B00]"><i class="fa-solid fa-calendar-days"></i></div>
          <span>As formações têm validade de <strong>1 ANO</strong>.</span>
        </div>
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-[#FF6B00]"><i class="fa-solid fa-hospital-user"></i></div>
          <span>Melhoria Contínua • Clínicas Médicas</span>
        </div>
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-[#FF6B00]"><i class="fa-solid fa-shield-halved"></i></div>
          <span>Mais segurança para o médico, mais qualidade para o paciente.</span>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* Reset global para evitar margens brancas à volta da página */
:global(html, body) {
  margin: 0;
  padding: 0;
  background-color: #040B16;
  width: 100%;
  overflow-x: hidden;
}

.auth-wrapper {
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

.luz-orbe {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.8;
  will-change: transform;
}

.particula {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.7;
  box-shadow: 0 0 15px currentColor;
  will-change: transform;
}

@keyframes flutuar1 {
  0% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(300px, 220px) scale(1.4); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes flutuar2 {
  0% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(-280px, -200px) scale(1.5); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes flutuar3 {
  0% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(220px, -250px) scale(1.3); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes moverParticula1 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(150px, -180px) scale(1.5); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes moverParticula2 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-180px, 200px) scale(0.8); }
  100% { transform: translate(0, 0) scale(1); }
}

@keyframes moverParticula3 {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(120px, 150px) scale(1.4); }
  100% { transform: translate(0, 0) scale(1); }
}

.animate-flutuar-1 {
  animation: flutuar1 7s ease-in-out infinite;
}

.animate-flutuar-2 {
  animation: flutuar2 10s ease-in-out infinite;
}

.animate-flutuar-3 {
  animation: flutuar3 8s ease-in-out infinite;
}

.animate-particula-1 {
  animation: moverParticula1 5s ease-in-out infinite;
}

.animate-particula-2 {
  animation: moverParticula2 7s ease-in-out infinite;
}

.animate-particula-3 {
  animation: moverParticula3 6s ease-in-out infinite;
}
</style>