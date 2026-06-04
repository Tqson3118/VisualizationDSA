<template>
  <div
    class="uml-class-card"
    :class="{
      'encapsulation-breach-wiggle': isWiggling,
      'card-active': isActive,
      'abstract-card-style': classDef.isAbstract
    }"
  >
    <!-- Class Header -->
    <div class="card-header" :style="{ borderColor: headerColor }">
      <div class="flex flex-col">
        <span v-if="classDef.isAbstract" class="text-[9px] uppercase tracking-wider text-text-muted font-bold"><span class="italic">&lt;&lt;abstract&gt;&gt;</span></span>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold" :style="{ color: headerColor }" :class="{ 'italic': classDef.isAbstract }">
            {{ classDef.className }}
          </span>
          <span v-if="classDef.parentClass" class="text-[10px] font-mono text-text-muted">
            extends {{ classDef.parentClass }}
          </span>
          <span v-else-if="classDef.isAbstract" class="text-[10px] font-mono text-text-muted">Abstract Class</span>
          <span v-else class="text-[10px] font-mono text-text-muted">Base Class</span>
        </div>
      </div>
    </div>

    <!-- Fields Section -->
    <div class="card-body">
      <div class="section-label">Fields</div>
      <div v-if="allFields.length === 0" class="text-[10px] text-text-disabled italic py-1">No fields</div>
      <div v-for="field in allFields" :key="field.name" class="member-row" :class="{ 'inherited-member': field.isInherited }">
        <button
          :id="`class-${classDef.className}-field-${field.name}`"
          class="member-btn"
          :class="{ 'member-violated': isFieldViolated(field.name) }"
          @click="onFieldClick(field)"
        >
          <AccessModifierPadlock :modifier="field.accessModifier" :size="'sm'" />
          <span class="text-text-secondary text-xs" :class="{ 'opacity-60': field.isInherited }">
            {{ field.name }}: {{ field.returnType || 'any' }}
          </span>
          <span v-if="field.isInherited" class="ml-auto text-[8px] text-text-disabled uppercase">inherited</span>
          <span
            v-else-if="field.accessModifier === 'PRIVATE'"
            class="ml-auto text-[10px] text-accent-red"
          >🔒</span>
          <span
            v-else-if="field.accessModifier === 'PROTECTED'"
            class="ml-auto text-[10px] text-accent-yellow"
          >🔓</span>
        </button>
      </div>

      <!-- Divider -->
      <div class="section-divider"></div>

      <!-- Methods Section -->
      <div class="section-label">Methods</div>
      <div v-if="allMethods.length === 0" class="text-[10px] text-text-disabled italic py-1">No methods</div>
      <div v-for="method in allMethods" :key="method.name" class="member-row" :class="{ 'inherited-member': method.isInherited }">
        <button
          :id="`class-${classDef.className}-method-${method.name}`"
          class="member-btn"
          :class="{
            'member-selected': isMethodSelected(method.name),
            'opacity-60': method.isInherited
          }"
          @click="onMethodClick(method)"
        >
          <AccessModifierPadlock :modifier="method.accessModifier" :size="'sm'" />
          <span class="text-text-secondary text-xs" :class="{ 'italic text-text-muted': method.isAbstract }">
            {{ method.name }}(): {{ method.returnType || 'void' }}
          </span>
          <span
            v-if="method.isInherited"
            class="ml-auto text-[8px] text-text-disabled uppercase font-bold"
          >inherited</span>
          <span
            v-else-if="method.isAbstract"
            class="ml-auto text-[8px] text-accent-yellow uppercase font-bold"
          >abstract</span>
          <span
            v-else-if="method.isOverridden"
            class="ml-auto text-[10px] font-bold"
            :style="{ color: headerColor }"
          >@Override</span>
          <span
            v-else
            class="ml-auto text-[10px] text-text-muted"
          >virtual</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ClassDefinition, ClassMember } from '../types/oop-visualization.types';
import { useOOPVisualizerStore } from '../store/useOOPVisualizerStore';
import AccessModifierPadlock from './AccessModifierPadlock.vue';

interface RichMember extends ClassMember {
  isInherited?: boolean;
  inheritedFrom?: string;
}

const props = defineProps<{
  classDef: ClassDefinition;
  headerColor: string;
  isActive?: boolean;
  isWiggling?: boolean;
  violatedField?: string | null;
  selectedMethod?: string | null;
}>();

const emit = defineEmits<{
  (e: 'method-click', className: string, methodName: string): void;
  (e: 'field-click', className: string, fieldName: string): void;
}>();

const store = useOOPVisualizerStore();

// Dynamically scan for inherited members from base class
const allFields = computed<RichMember[]>(() => {
  const list: RichMember[] = [...props.classDef.members.filter((m) => m.type === 'FIELD')];
  
  let parentName = props.classDef.parentClass;
  while (parentName) {
    const parentDef = store.registeredClasses.find((c) => c.className === parentName);
    if (parentDef) {
      const parentFields = parentDef.members
        .filter((m) => m.type === 'FIELD' && !list.some((l) => l.name === m.name))
        .map((m) => ({ ...m, isInherited: true, inheritedFrom: parentName }));
      list.unshift(...parentFields);
    }
    parentName = parentDef?.parentClass;
  }
  return list;
});

const allMethods = computed<RichMember[]>(() => {
  const list: RichMember[] = [...props.classDef.members.filter((m) => m.type === 'METHOD')];
  
  let parentName = props.classDef.parentClass;
  while (parentName) {
    const parentDef = store.registeredClasses.find((c) => c.className === parentName);
    if (parentDef) {
      const parentMethods = parentDef.members
        .filter((m) => m.type === 'METHOD' && !list.some((l) => l.name === m.name))
        .map((m) => ({ ...m, isInherited: true, inheritedFrom: parentName }));
      list.unshift(...parentMethods);
    }
    parentName = parentDef?.parentClass;
  }
  return list;
});

function isFieldViolated(fieldName: string): boolean {
  return props.violatedField === fieldName;
}

function isMethodSelected(methodName: string): boolean {
  return props.selectedMethod === `${props.classDef.className}.${methodName}`;
}

function onMethodClick(method: RichMember): void {
  // If inherited, target call should execute on the base class where it is defined
  const targetClass = method.isInherited ? method.inheritedFrom : props.classDef.className;
  if (targetClass) {
    emit('method-click', targetClass, method.name);
  }
}

function onFieldClick(field: RichMember): void {
  const targetClass = field.isInherited ? field.inheritedFrom : props.classDef.className;
  if (targetClass) {
    emit('field-click', targetClass, field.name);
  }
}
</script>

<style scoped>
.uml-class-card {
  width: 100%;
  background: color-mix(in srgb, var(--vis-panel-bg) 45%, transparent);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--shadow-lg);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
  overflow: hidden;
}

.uml-class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
}

.card-active {
  border-color: color-mix(in srgb, var(--color-accent-cyan) 40%, transparent);
  box-shadow: 0 0 20px var(--color-accent-cyan-glow);
}

.abstract-card-style {
  background: color-mix(in srgb, var(--vis-panel-bg) 35%, transparent);
  border-style: dashed;
}

.encapsulation-breach-wiggle {
  animation: wiggle-vibrate 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  animation-iteration-count: 5;
  border-color: var(--color-accent-red) !important;
  box-shadow: 0 0 25px var(--color-accent-red-glow) !important;
}

@keyframes wiggle-vibrate {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

.card-header {
  border-bottom: 1px solid;
  padding: 10px 16px;
  background: color-mix(in srgb, var(--vis-panel-header-bg) 60%, transparent);
}

.card-body {
  padding: 12px 16px;
}

.section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.section-divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 10px 0;
}

.member-row {
  margin-bottom: 2px;
}

.inherited-member {
  border-left: 2px dotted var(--color-border-subtle);
  padding-left: 4px;
}

.member-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
}

.member-btn:hover {
  background: var(--color-bg-hover);
}

.member-selected {
  background: var(--color-accent-purple-dim) !important;
  border-color: color-mix(in srgb, var(--color-accent-purple) 30%, transparent) !important;
}

.member-violated {
  background: var(--color-accent-red-dim) !important;
  border-color: color-mix(in srgb, var(--color-accent-red) 40%, transparent) !important;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
