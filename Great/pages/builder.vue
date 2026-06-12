<template>
  <div v-if="isAuthed && !isLoading" class="h-screen w-full flex flex-col items-center justify-center">
    <div v-if="recipe.currentStep === 1" class="flex flex-col items-center text-center mb-5" >
      <h2 class="mb-4">Hot or Cold?</h2>
      <div class="flex gap-6">
        <button class="neu-circle" data-icon="🔥" @click="pickTemp('hot')">Hot</button>
        <button class="neu-circle" data-icon="🧊" @click="pickTemp('cold')">Cold</button>
      </div>
    </div>

    <div v-if="recipe.currentStep === 2">
      <h2>Ice level?</h2>
      <div class="flex flex-wrap gap-4 justify-center">
        <button @click="pickIce('none')">No Ice</button>
        <button @click="pickIce('less')">Less Ice</button>
        <button @click="pickIce('normal')">Normal Ice</button>
        <button @click="pickIce('extra')">Extra Ice</button>
        <button @click="recipe.reset(), recipe.currentStep = 1"> Reset </button>
      </div>
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
      <button @click="recipe.reset(), recipe.currentStep = 1"> Reset </button>
    </div>

    <div v-if="recipe.currentStep === 4">
      <h2>Pick other bases (optional, pick multiple)</h2>
      <div v-for="base in otherBases" :key="base.id">
        <button
          @click="toggleBase(base)"
          :style="isBaseSelected(base.id) ? 'outline: 2px solid black' : ''"
        >
          {{ base.name }}
        </button>
      </div>
      <button @click="recipe.currentStep = 5">Next →</button>
      <button @click="recipe.reset(), recipe.currentStep = 1"> Reset </button>
    </div>

    <div v-if="recipe.currentStep === 5">
      <h2>Pick add-ons (optional, pick multiple)</h2>
      <div v-for="addon in addons" :key="addon.id">
        <button
          @click="toggleAddon(addon)"
          :style="isAddonSelected(addon.id) ? 'outline: 2px solid black' : ''"
        >
          {{ addon.name }}
        </button>
      </div>
      <button @click="recipe.currentStep = 6">Next →</button>
      <button @click="recipe.reset(), recipe.currentStep = 1"> Reset </button>
    </div>

    <div v-if="recipe.currentStep === 6">
      <h2>Pick a foam (optional)</h2>
      <div v-for="foam in foams" :key="foam.id">
        <button
          @click="selectedFoam = foam"
          :style="
            selectedFoam?.id === foam.id ? 'outline: 2px solid black' : ''
          "
        >
          {{ foam.name }}
        </button>
      </div>
      <button @click="selectedFoam = null">No Foam</button>
      <button @click="confirmFoam">Confirm Foam →</button>
      <button @click="recipe.reset(), recipe.currentStep = 1"> Reset </button>
    </div>

    <div v-if="recipe.currentStep === 7">
      <h2>Pick powders (optional, pick multiple)</h2>
      <div v-for="powder in powders" :key="powder.id">
        <button
          @click="togglePowder(powder)"
          :style="isPowderSelected(powder.id) ? 'outline: 2px solid black' : ''"
        >
          {{ powder.name }}
        </button>
      </div>
      <button @click="recipe.currentStep = 8">Next →</button>
      <button @click="recipe.reset(), recipe.currentStep = 1"> Reset </button>
    </div>

    <div v-if="recipe.currentStep === 8">
      <h2>Review your drink</h2>
      <p>Temperature: {{ recipe.temperature }}</p>
      <p v-if="recipe.iceLevel">Ice: {{ recipe.iceLevel }}</p>
      <p v-if="selectedTea">Tea: {{ selectedTea.name }}</p>
      <p v-if="selectedBases.length">
        Bases: {{ selectedBases.map((b) => b.name).join(", ") }}
      </p>
      <p v-if="selectedAddons.length">
        Add-ons: {{ selectedAddons.map((a) => a.name).join(", ") }}
      </p>
      <p v-if="selectedFoam">Foam: {{ selectedFoam.name }}</p>
      <p v-if="selectedPowders.length">
        Powders: {{ selectedPowders.map((p) => p.name).join(", ") }}
      </p>

      <button @click="saveRecipe">Finalize Recipe</button>
      <button @click="recipe.reset(), recipe.currentStep = 1"> Reset </button>
    </div>
  </div>
  <div v-else-if="isLoading" class="loading-loader">
    <p>Loading your builder workspace...</p>
  </div>
</template>

<script setup lang="ts">
// Define types for ingredients mapping
interface Ingredient {
  id: number;
  name: string;
  category?: string;
  unit_behavior?: string;
  unit_type?: string;
}

definePageMeta({
  middleware: "auth",
});

const supabase = useSupabaseClient();
const recipe = useRecipeStore();

const isAuthed = ref(false);
const isLoading = ref(true);

// Ingredient arrays converted to reactive refs instead of top-level awaits
const teaBases = ref<Ingredient[]>([]);
const otherBases = ref<Ingredient[]>([]);
const addons = ref<Ingredient[]>([]);
const foams = ref<Ingredient[]>([]);
const powders = ref<Ingredient[]>([]);

// User selection states
const selectedTea = ref<Ingredient | null>(null);
const selectedBases = ref<Ingredient[]>([]);
const selectedAddons = ref<Ingredient[]>([]);
const selectedFoam = ref<Ingredient | null>(null);
const foamConfirmed = ref(false);
const selectedPowders = ref<Ingredient[]>([]);

onMounted(async () => {
  // 1. Verify session explicitly before attempting any RLS data fetches
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    await navigateTo("/");
    return;
  }
  isAuthed.value = true;

  try {
    // 2. Run all database fetches in parallel safely inside onMounted
    const [
      { data: teas },
      { data: bases },
      { data: addonsData },
      { data: foamsData },
      { data: powdersData },
    ] = await Promise.all([
      supabase
        .from("ingredients")
        .select("id, name, category, unit_behavior, unit_type")
        .eq("ingredient_type", "tea_base"),
      supabase
        .from("ingredients")
        .select("id, name, category, unit_behavior, unit_type")
        .eq("ingredient_type", "base"),
      supabase
        .from("ingredients")
        .select("id, name, category, unit_behavior, unit_type")
        .in("ingredient_type", ["addon", "addon_topping", "addon_syrup"]),
      supabase
        .from("ingredients")
        .select("id, name, category, unit_behavior, unit_type")
        .eq("ingredient_type", "foam"),
      supabase
        .from("ingredients")
        .select("id, name, category, unit_behavior, unit_type")
        .eq("ingredient_type", "powder"),
    ]);

    // 3. Populate reactive references safely
    teaBases.value = teas ?? [];
    otherBases.value = bases ?? [];
    addons.value = addonsData ?? [];
    foams.value = foamsData ?? [];
    powders.value = powdersData ?? [];
  } catch (err) {
    console.error("Error fetching ingredient configurations:", err);
  } finally {
    isLoading.value = false;
  }
});

function pickTemp(temp: "hot" | "cold") {
  recipe.setTemperature(temp);
  recipe.currentStep = temp === "hot" ? 3 : 2;
}

function pickIce(level: "none" | "less" | "normal" | "extra") {
  recipe.setIceLevel(level);
  recipe.currentStep = 3;
}

function pickTea(tea: Ingredient) {
  if (selectedTea.value?.id === tea.id) {
    selectedTea.value = null;
    return;
  }
  selectedTea.value = tea;
}

function toggleBase(base: Ingredient) {
  const index = selectedBases.value.findIndex((b) => b.id === base.id);
  if (index === -1) {
    selectedBases.value.push(base);
  } else {
    selectedBases.value.splice(index, 1);
  }
}

function isBaseSelected(id: number) {
  return selectedBases.value.some((b) => b.id === id);
}

function toggleAddon(addon: Ingredient) {
  const index = selectedAddons.value.findIndex((a) => a.id === addon.id);
  if (index === -1) {
    selectedAddons.value.push(addon);
  } else {
    selectedAddons.value.splice(index, 1);
  }
}

function isAddonSelected(id: number) {
  return selectedAddons.value.some((a) => a.id === id);
}

function confirmFoam() {
  foamConfirmed.value = true;
  recipe.currentStep = 7;
}

function togglePowder(powder: Ingredient) {
  const index = selectedPowders.value.findIndex((p) => p.id === powder.id);
  if (index === -1) {
    selectedPowders.value.push(powder);
  } else {
    selectedPowders.value.splice(index, 1);
  }
}

function isPowderSelected(id: number) {
  return selectedPowders.value.some((p) => p.id === id);
}

async function saveRecipe() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const allIngredients = [
    ...(selectedTea.value
      ? [{ ...selectedTea.value, selectionType: "liquid" as const }]
      : []),
    ...selectedBases.value.map((b) => ({
      ...b,
      selectionType: "liquid" as const,
    })),
    ...selectedAddons.value.map((a) => ({
      ...a,
      selectionType: "click" as const,
    })),
    ...(selectedFoam.value
      ? [{ ...selectedFoam.value, selectionType: "foam" as const }]
      : []),
    ...selectedPowders.value.map((p) => ({
      ...p,
      selectionType: "click" as const,
    })),
  ];

  const { data: recipeRow, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: session.user.id,
      temperature: recipe.temperature,
      ice_level: recipe.iceLevel,
      status: "draft",
    })
    .select()
    .single();

  if (recipeError) {
    console.error("Recipe save failed:", recipeError.message);
    return;
  }

  const selections = allIngredients.map((ing, index) => ({
    recipe_id: recipeRow.id,
    ingredient_id: ing.id,
    quantity: 1,
    amount_value: 1,
    amount_unit: "portion",
    stack_order: index,
    selection_type: ing.selectionType,
  }));

  const { error: selError } = await supabase
    .from("recipe_ingredient_selections")
    .insert(selections);

  if (selError) {
    console.error("Selections save failed:", selError.message);
    return;
  }

  // Route first, then clean up the store to prevent DOM flashes or data-wipe issues during page transition
  await navigateTo("/dashboard");
  recipe.reset();
}
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap');
</style>
