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
      <button
        @click="
          recipe.reset();
          recipe.currentStep = 1;
        "
      >
        Reset
      </button>
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
    return;
  }
  isAuthed.value = true;
});

const { data: teaBases } = await supabase
  .from("ingredients")
  .select("id, name, category, unit_behavior, unit_type")
  .eq("ingredient_type", "tea_base");

const { data: otherBases } = await supabase
  .from("ingredients")
  .select("id, name, category, unit_behavior, unit_type")
  .eq("ingredient_type", "base");

const { data: addons } = await supabase
  .from("ingredients")
  .select("id, name, category, unit_behavior, unit_type")
  .in("ingredient_type", ["addon", "addon_topping", "addon_syrup"]);

const { data: foams } = await supabase
  .from("ingredients")
  .select("id, name, category, unit_behavior, unit_type")
  .eq("ingredient_type", "foam");
const { data: powders } = await supabase
  .from("ingredients")
  .select("id, name, category, unit_behavior, unit_type")
  .eq("ingredient_type", "powder");

const selectedTea = ref<{ id: number; name: string } | null>(null);
const selectedBases = ref<{ id: number; name: string }[]>([]);
const selectedAddons = ref<{ id: number; name: string }[]>([]);
const selectedFoam = ref<{ id: number; name: string } | null>(null);
const foamConfirmed = ref(false);
const selectedPowders = ref<{ id: number; name: string }[]>([]);

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

function toggleBase(base: { id: number; name: string }) {
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

function toggleAddon(addon: { id: number; name: string }) {
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
function togglePowder(powder: { id: number; name: string }) {
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

  // Collect all selected ingredients
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

  // Insert recipe row
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

  recipe.reset();
  navigateTo("/dashboard");
}
</script>
