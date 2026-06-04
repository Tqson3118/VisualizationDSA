<template>
  <div class="di-sandbox backdrop-blur-md border border-border-subtle/80 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border-subtle pb-4">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-accent">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
          <path d="m12 15-3-3a22 22 0 0 1 2-3.93A9.88 9.88 0 0 1 12 11c.96 0 2.68.37 4.12-1.91a22 22 0 0 1 2 3.93l-3 3"/>
          <path d="M9 12H4.5a2.5 2.5 0 0 1 0-5H9M15 12h4.5a2.5 2.5 0 0 0 0-5H15"/>
        </svg>
        <span class="text-xs font-bold uppercase tracking-wider text-text-secondary">DI Container & IoC Visualizer</span>
      </div>
      <span class="text-[10px] font-bold uppercase tracking-wider bg-accent-cyan/40 text-accent border border-accent-cyan/40 px-2 py-1 rounded-lg">Sprint 8</span>
    </div>

    <!-- IoC Concept Explanation -->
    <div class="ioc-concept-box p-4 border border-border-subtle rounded-xl flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-accent-cyan/50 border border-accent-cyan/30 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-accent" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5 5 4 4 0 0 1-5-5 10 10 0 0 0 10-10z"/>
        </svg>
      </div>
      <div>
        <div class="text-sm font-bold text-text-secondary">Inversion of Control (IoC)</div>
        <div class="text-xs text-text-secondary mt-1">Thay vì class tự tạo dependencies, Container sẽ tiêm chúng vào. Visualize cách dependencies được resolve và quản lý vòng đời.</div>
      </div>
    </div>

    <!-- Service Panels Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DIServiceList :registrations="registrations" :selected-service="selectedService" @select="selectService" @load-sample="registerSampleServices" />
      <DIDependencyGraph :registrations="registrations" :selected-service="selectedService" :cycle-result="cycleResult" @select="selectService" @check-cycles="checkCycles" />
    </div>

    <!-- Resolve Demo Panel -->
    <DIResolutionDemo :registrations="registrations" :singletons="singletons" :resolution-result="resolutionResult" v-model:service-to-resolve="serviceToResolve" @resolve="resolveService" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  DIContainerEngine,
  type ServiceRegistration,
  type ServiceInstance,
  type CycleDetectionResult,
  type ResolutionResult,
} from '../DIContainerEngine';
import DIServiceList from './DIServiceList.vue';
import DIDependencyGraph from './DIDependencyGraph.vue';
import DIResolutionDemo from './DIResolutionDemo.vue';

const registrations = ref<ServiceRegistration[]>([]);
const selectedService = ref<string>('');
const cycleResult = ref<CycleDetectionResult | null>(null);
const serviceToResolve = ref<string>('');
const resolutionResult = ref<ResolutionResult | null>(null);
const singletons = ref<ServiceInstance[]>([]);

function selectService(name: string) {
  selectedService.value = name;
  serviceToResolve.value = name;
}

function checkCycles() {
  cycleResult.value = DIContainerEngine.detectCycles();
}

function resolveService() {
  if (!serviceToResolve.value) return;
  resolutionResult.value = DIContainerEngine.resolve(serviceToResolve.value);
  singletons.value = DIContainerEngine.getSingletonInstances();
}

function registerSampleServices() {
  DIContainerEngine.reset();
  [
    { interfaceName: 'ILogger', implementationName: 'ConsoleLogger', lifetime: 'SINGLETON', dependencies: [] },
    { interfaceName: 'IDatabase', implementationName: 'PostgreSQLDatabase', lifetime: 'SINGLETON', dependencies: ['ILogger'] },
    { interfaceName: 'IUserRepository', implementationName: 'UserRepository', lifetime: 'TRANSIENT', dependencies: ['IDatabase'] },
    { interfaceName: 'IAuthService', implementationName: 'JwtAuthService', lifetime: 'TRANSIENT', dependencies: ['IUserRepository', 'ILogger'] },
    { interfaceName: 'IUserController', implementationName: 'UserController', lifetime: 'TRANSIENT', dependencies: ['IAuthService', 'IUserRepository'] },
  ].forEach(s => DIContainerEngine.register(s as ServiceRegistration));
  registrations.value = DIContainerEngine.getAllRegistrations();
  cycleResult.value = null;
  resolutionResult.value = null;
  singletons.value = [];
}

onMounted(() => registerSampleServices());
</script>

<style scoped>
.di-sandbox {
  background-color: color-mix(in srgb, var(--vis-panel-bg) 70%, transparent);
}
.ioc-concept-box {
  background-color: color-mix(in srgb, var(--color-bg-primary) 60%, transparent);
}
</style>

