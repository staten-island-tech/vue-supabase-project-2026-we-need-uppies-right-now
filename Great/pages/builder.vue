<template>
  <div v-if="isAuthed">
    <div v-if="recipe.currentStep === 1">
      <h2>Hot or cold?</h2>
      <button @click="pickTemp('hot')">Hot</button>
      <button @click="pickTemp('cold')">Cold</button>
    </div>

    <div v-if="recipe.currentStep === 2">
      <h2>Ice level?</h2>
      <button @click="pickIce('none')">No Ice</button>
      <button @click="pickIce('less')">Less Ice</button>
      <button @click="pickIce('normal')">Normal Ice</button>
      <button @click="pickIce('extra')">Extra Ice</button>
    </div>

    <div v-if="recipe.currentStep === 3">
      <h2>Pick a tea base (optional, max 1)</h2>
      <div v-for="tea in teaBases" :key="tea.id">
        <button
          @click="pickTea(tea)"
          :style="selectedTea?.id === tea.id ? 'outline: 2px solid black' : ''"
        >
          {{ tea.name }}
        </button>
      </div>
      <button @click="recipe.currentStep = 4">Next →</button>
    </div>

    <div v-if="recipe.currentStep === 4">
      <h2>Step 4 coming soon</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const supabase = useSupabaseClient();
const recipe = useRecipeStore();
const isAuthed = ref(false);

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    navigateTo("/");
  } else {
    isAuthed.value = true;
  }
});

const { data: teaBases } = await supabase
  .from("ingredients")
  .select("id, name, category, unit_behavior, unit_type")
  .eq("ingredient_type", "tea_base");

const selectedTea = ref<{ id: number; name: string } | null>(null);

function pickTemp(temp: "hot" | "cold") {
  recipe.setTemperature(temp);
  recipe.currentStep = temp === "hot" ? 3 : 2;
}

function pickIce(level: "none" | "less" | "normal" | "extra") {
  recipe.setIceLevel(level);
  recipe.currentStep = 3;
}

function pickTea(tea: { id: number; name: string }) {
  if (selectedTea.value?.id === tea.id) {
    selectedTea.value = null;
    return;
  }
  selectedTea.value = tea;
}

//this is a commwent hiii
</script>
