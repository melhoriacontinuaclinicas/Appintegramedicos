<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const props = defineProps(['userProfile'])
const visaoAtual = ref('medico') // 'medico' ou 'admin'
const modules = ref([])
const progress = ref({})
const loading = ref(true)

// Controlo da Senha de Administrador
const adminAutenticado = ref(false)
const senhaAdminInput = ref('')
const erroAdmin = ref('')
const SENHA_MESTRE_ADMIN = 'admin123' // Podes alterar a senha do ADM aqui

const tentarAcederAdmin = () => {
  erroAdmin.value = ''
  if (senhaAdminInput.value === SENHA_MESTRE_ADMIN) {
    adminAutenticado.value = true
    visaoAtual.value = 'admin'
    senhaAdminInput.value = ''
  } else {
    erroAdmin.value = 'Senha de administrador incorreta.'
  }
}

const sairAdmin = () => {
  adminAutenticado.value = false
  visaoAtual.value = 'medico'
}

const outroMedicos = ref([
  { nome: "Dra. Juliana Mendes", crm: "CRM/SP 142981", especialidade: "Cardiologia", mod1: true, mod2: true, mod3: true },
  { nome: "Dr. Roberto Silveira", crm: "CRM/CE 98321", especialidade: "Pediatria", mod1: true, mod2: false, mod3: false },
  { nome: "Dra. Camila Vasconcelos", crm: "CRM/PE 112344", especialidade: "Ginecologia", mod1: true, mod2: true, mod3: false },
  { nome: "Dr. Marcelo Antunes", crm: "CRM/BA 87654", especialidade: "Ortopedia", mod1: false, mod2: false, mod3: false }
])

const fetchTrilhaData = async () => {
  loading.value = true
  try {
    const { data: modsData, error } = await supabase
      .from('integra_medicos_modules')
      .select('*, integra_medicos_materials(*)')
      .order('order_index', { ascending: true })

    if (!error && modsData && modsData.length > 0) {
      modules.value = modsData
    }

    if (props.userProfile?.id) {
      const { data: progData } = await supabase
        .from('integra_medicos_progress')
        .select('*')
        .eq('user_id', props.userProfile.id)

      const progMap = {}
      if (progData) {
        progData.forEach(p => {
          progMap[p.module_id] = { pre: p.pre_completed, post: p.post_completed }
        })
      }
      progress.value = progMap
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  } finally {
    loading.value = false
  }
}

const togglePreTest = async (moduleId) => {
  const current = progress.value[moduleId]?.pre || false
  const updatedPre = !current
  await salvarProgressoNoBanco(moduleId, updatedPre, progress.value[moduleId]?.post || false)
}

const togglePostTest = async (moduleId) => {
  const current = progress.value[moduleId]?.post || false
  const updatedPost = !current
  await salvarProgressoNoBanco(moduleId, progress.value[moduleId]?.pre || false, updatedPost)
}

const salvarProgressoNoBanco = async (moduleId, preVal, postVal) => {
  if (!props.userProfile?.id) return
  try {
    await supabase
      .from('integra_medicos_progress')
      .upsert({
        user_id: props.userProfile.id,
        module_id: moduleId,
        pre_completed: preVal,
        post_completed: postVal,
        updated_at: new Date()
      }, { onConflict: 'user_id,module_id' })

    if (!progress.value[moduleId]) progress.value[moduleId] = {}
    progress.value[moduleId].pre = preVal
    progress.value[moduleId].post = postVal
  } catch (error) {
    console.error('Erro ao salvar progresso:', error.message)
  }
}

const calcularProgressoGeral = () => {
  if (modules.value.length === 0) return 0
  let concluidos = 0
  modules.value.forEach(mod => {
    if (progress.value[mod.id]?.post) concluidos++
  })
  return Math.round((concluidos / modules.value.length) * 100)
}

const calcularModulosConcluidosCount = () => {
  let concluidos = 0
  modules.value.forEach(mod => {
    if (progress.value[mod.id]?.post) concluidos++
  })
  return concluidos
}

onMounted(() => {
  fetchTrilhaData()
})
</script>

<template>
  <div class="space-y-8 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Alternador de Abas com Proteção de Senha para o Admin -->
    <div class="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
      <div class="flex items-center space-x-2 pl-4">
        <span class="text-xs font-bold text-[#0B2545] uppercase tracking-wider">Modo de Visualização:</span>
      </div>
      <div class="flex space-x-2">
        <button @click="visaoAtual = 'medico'" :class="visaoAtual === 'medico' ? 'bg-[#0B2545] text-white shadow-md' : 'text-gray-600 hover:text-[#0B2545]'" class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2">
          <i class="fa-solid fa-stethoscope"></i>
          <span>Portal do Médico</span>
        </button>
        <button @click="adminAutenticado ? (visaoAtual = 'admin') : (visaoAtual = 'admin')" :class="visaoAtual === 'admin' ? 'bg-[#0B2545] text-white shadow-md' : 'text-gray-600 hover:text-[#0B2545]'" class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center space-x-2">
          <i class="fa-solid fa-shield-halved"></i>
          <span>Painel do Administrador <span v-if="!adminAutenticado" class="text-[10px] bg-orange-100 text-[#FF6B00] px-1.5 py-0.5 rounded ml-1 font-bold">Restrito</span></span>
        </button>
      </div>
    </div>

    <!-- MODAL DE SENHA PARA O PAINEL ADMIN -->
    <div v-if="!adminAutenticado && visaoAtual === 'admin'" class="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-md mx-auto text-center space-y-4 my-12">
      <div class="w-14 h-14 bg-orange-50 text-[#FF6B00] rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
        <i class="fa-solid fa-lock"></i>
      </div>
      <h3 class="text-xl font-extrabold text-[#0B2545]">Acesso Restrito ao Administrador</h3>
      <p class="text-xs text-gray-500">Insira a senha mestra para visualizar o painel de controlo da rede médica.</p>
      
      <div v-if="erroAdmin" class="bg-red-50 text-red-600 p-2.5 rounded-xl text-xs font-semibold border border-red-200">
        {{ erroAdmin }}
      </div>

      <form @submit.prevent="tentarAcederAdmin" class="space-y-3">
        <input v-model="senhaAdminInput" type="password" required placeholder="Digite a senha de administrador" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#FF6B00] text-center font-bold tracking-widest">
        <button type="submit" class="w-full bg-[#0B2545] hover:bg-[#13396b] text-white font-bold py-3 rounded-xl text-xs transition uppercase tracking-wider shadow-lg">
          Desbloquear Painel
        </button>
      </form>
    </div>

    <!-- ========================================== -->
    <!-- VISÃO 1: PORTAL DO MÉDICO                   -->
    <!-- ========================================== -->
    <div v-if="visaoAtual === 'medico'" class="space-y-8">
      <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0B2545] border border-blue-100 text-xl font-extrabold">
            {{ props.userProfile?.full_name ? props.userProfile.full_name.slice(0, 2).toUpperCase() : 'DR' }}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="bg-blue-100 text-[#0B2545] text-xs font-bold px-2.5 py-0.5 rounded-full">CRM Ativo: {{ props.userProfile?.crm }}</span>
              <span class="text-xs text-gray-400">{{ props.userProfile?.specialty || 'Clínico Geral' }}</span>
            </div>
            <!-- Exibe o nome limpo com apenas um Dr. -->
            <h2 class="text-2xl font-extrabold text-[#0B2545] mt-1">Olá, {{ props.userProfile?.full_name }}</h2>
            <p class="text-gray-500 text-xs sm:text-sm">Realize o pré-teste do módulo, estude os materiais e conclua o pós-teste.</p>
          </div>
        </div>

        <div class="bg-[#F4F7FC] rounded-2xl p-4 w-full lg:w-72 border border-gray-200">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-bold text-gray-700 uppercase">Status de Formação</span>
            <span class="text-xs font-extrabold text-[#FF6B00]">{{ calcularProgressoGeral() }}%</span>
          </div>
          <div class="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div class="bg-[#FF6B00] h-full rounded-full transition-all duration-500" :style="{ width: calcularProgressoGeral() + '%' }"></div>
          </div>
          <p class="text-[11px] text-gray-500 mt-2 text-right">{{ calcularModulosConcluidosCount() }} de {{ modules.length }} módulos concluídos</p>
        </div>
      </div>

      <!-- Grade dos Módulos -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div v-for="mod in modules" :key="mod.id" class="bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
          <div class="bg-[#0B2545] text-white py-3 px-6 flex justify-between items-center">
            <span class="text-xs font-bold uppercase tracking-widest text-[#FF6B00] bg-white/10 px-3 py-1 rounded-full">Módulo 0{{ mod.id }}</span>
            <i class="fa-solid fa-graduation-cap text-[#FF6B00] text-xl"></i>
          </div>

          <div class="p-6 flex-grow flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-[#0B2545]">{{ mod.title }}</h3>
                <span class="text-[11px] font-bold px-2.5 py-1 rounded-full" :class="progress[mod.id]?.post ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                  {{ progress[mod.id]?.post ? 'Concluído' : 'Pendente' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mb-4">{{ mod.description }}</p>

              <!-- Pré-teste -->
              <div class="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 mb-4">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-bold text-[#0B2545]"><i class="fa-solid fa-clipboard-question mr-1"></i> Pré-teste do Módulo</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded" :class="progress[mod.id]?.pre ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                    {{ progress[mod.id]?.pre ? 'Realizado' : 'Pendente' }}
                  </span>
                </div>
                <div class="flex space-x-2 mt-2">
                  <a :href="mod.pre_test_url || '#'" target="_blank" class="flex-1 bg-[#0B2545] text-white text-center py-2 rounded-xl text-xs font-semibold hover:bg-[#13396b] transition">Aceder Pré-teste</a>
                  <button @click="togglePreTest(mod.id)" class="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition">
                    <i class="fa-solid fa-check"></i>
                  </button>
                </div>
              </div>

              <!-- Materiais -->
              <div class="mb-4">
                <span class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block"><i class="fa-solid fa-book-open text-[#FF6B00] mr-1"></i> Materiais de Estudo</span>
                <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                  <div v-for="mat in mod.integra_medicos_materials" :key="mat.id" class="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                    <span class="font-medium text-gray-700 truncate max-w-[170px]"><i class="fa-solid fa-file-pdf text-[#FF6B00] mr-1"></i> {{ mat.title }}</span>
                    <a :href="mat.file_url" target="_blank" class="text-blue-600 font-semibold hover:underline">Abrir</a>
                  </div>
                </div>
              </div>

              <!-- Pós-teste -->
              <div class="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 mb-4">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-bold text-emerald-900"><i class="fa-solid fa-square-poll-vertical text-emerald-600 mr-1"></i> Pós-teste do Módulo</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded" :class="progress[mod.id]?.pre ? (progress[mod.id]?.post ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800') : 'bg-gray-200 text-gray-600'">
                    {{ progress[mod.id]?.pre ? (progress[mod.id]?.post ? 'Aprovado' : 'Liberado') : 'Bloqueado' }}
                  </span>
                </div>
                <div class="flex space-x-2 mt-2">
                  <a :href="mod.post_test_url || '#'" target="_blank" class="flex-1 bg-emerald-600 text-white text-center py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition" :class="{'pointer-events-none opacity-50': !progress[mod.id]?.pre}">Aceder Pós-teste</a>
                  <button @click="togglePostTest(mod.id)" :disabled="!progress[mod.id]?.pre" class="px-3 py-2 rounded-xl text-xs font-semibold transition" :class="progress[mod.id]?.pre ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'">
                    <i class="fa-solid fa-check"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-gray-100 mt-auto">
              <div v-if="progress[mod.id]?.post" class="w-full bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-xl text-xs text-center shadow-md flex items-center justify-center space-x-2">
                <i class="fa-solid fa-circle-check"></i><span>Módulo Concluído!</span>
              </div>
              <div v-else-if="progress[mod.id]?.pre" class="w-full bg-blue-50 text-[#0B2545] font-semibold py-2.5 px-4 rounded-xl text-xs text-center border border-blue-200">
                Estude os materiais e faça o pós-teste
              </div>
              <div v-else class="w-full bg-gray-100 text-gray-500 font-semibold py-2.5 px-4 rounded-xl text-xs text-center">
                Realize o pré-teste para liberar
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- ========================================== -->
    <!-- VISÃO 2: PAINEL ADMIN (APENAS COM SENHA)    -->
    <!-- ========================================== -->
    <div v-if="adminAutenticado && visaoAtual === 'admin'" class="space-y-8">
      <div class="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h3 class="text-lg font-bold text-[#0B2545]">Painel Administrativo Ativo</h3>
          <p class="text-xs text-gray-500">Sessão de administrador validada com sucesso.</p>
        </div>
        <button @click="sairAdmin" class="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl transition">
          <i class="fa-solid fa-lock mr-1"></i> Bloquear Painel
        </button>
      </div>

      <div class="bg-white rounded-3xl p-6 lg:p-8 shadow-lg border border-gray-100">
        <h3 class="text-xl font-bold text-[#0B2545] mb-4">Acompanhamento da Rede Médica</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#F4F7FC] text-[#0B2545] text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                <th class="p-4 rounded-l-xl">Médico / CRM</th>
                <th class="p-4">Especialidade</th>
                <th class="p-4">Módulo 01</th>
                <th class="p-4">Módulo 02</th>
                <th class="p-4">Módulo 03</th>
                <th class="p-4 rounded-r-xl">Progresso</th>
              </tr>
            </thead>
            <tbody class="text-xs sm:text-sm text-gray-700 divide-y divide-gray-100">
              <tr class="bg-blue-50/20 font-medium">
                <td class="p-4">
                  <p class="font-bold text-[#0B2545]">{{ props.userProfile?.full_name }} <span class="text-[10px] bg-[#FF6B00] text-white px-2 py-0.5 rounded-full ml-1">Você</span></p>
                  <p class="text-xs text-gray-400">{{ props.userProfile?.crm }}</p>
                </td>
                <td class="p-4">{{ props.userProfile?.specialty || 'Clínico Geral' }}</td>
                <td class="p-4"><i :class="progress[1]?.post ? 'fa-solid fa-circle-check text-emerald-600 text-lg' : 'fa-solid fa-clock text-amber-500'"></i></td>
                <td class="p-4"><i :class="progress[2]?.post ? 'fa-solid fa-circle-check text-emerald-600 text-lg' : 'fa-solid fa-clock text-amber-500'"></i></td>
                <td class="p-4"><i :class="progress[3]?.post ? 'fa-solid fa-circle-check text-emerald-600 text-lg' : 'fa-solid fa-clock text-amber-500'"></i></td>
                <td class="p-4 font-bold text-[#0B2545]">{{ calcularProgressoGeral() }}%</td>
              </tr>
              <tr v-for="(med, idx) in outroMedicos" :key="idx" class="hover:bg-[#F4F7FC]/50 transition">
                <td class="p-4">
                  <p class="font-bold text-gray-800">{{ med.nome }}</p>
                  <p class="text-xs text-gray-400">{{ med.crm }}</p>
                </td>
                <td class="p-4 text-gray-600">{{ med.especialidade }}</td>
                <td class="p-4"><i :class="med.mod1 ? 'fa-solid fa-circle-check text-emerald-600 text-lg' : 'fa-solid fa-xmark text-gray-300'"></i></td>
                <td class="p-4"><i :class="med.mod2 ? 'fa-solid fa-circle-check text-emerald-600 text-lg' : 'fa-solid fa-xmark text-gray-300'"></i></td>
                <td class="p-4"><i :class="med.mod3 ? 'fa-solid fa-circle-check text-emerald-600 text-lg' : 'fa-solid fa-xmark text-gray-300'"></i></td>
                <td class="p-4 font-bold text-gray-700">66%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>