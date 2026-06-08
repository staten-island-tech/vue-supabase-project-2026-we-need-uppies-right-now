<template>
  <div v-if="mounted && isAuthed">
    <button @click="logout">Logout</button>

    <div>
      <h1>Hello, {{ username }}!</h1>
      <button @click="navigateTo('/builder')">Start Building</button>
    </div>
  </div>
  <div v-else>
    <!-- placeholder while mounting to keep SSR/CSR consistent -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  ssr: false, // client-only to prevent SSR/CSR hydration mismatches
});

const supabase = useSupabaseClient();
const isAuthed = ref(false);
const username = ref("");
const mounted = ref(false);

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    navigateTo("/");
    return;
  }
  isAuthed.value = true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", session.user.id)
    .single();

  if (profile) username.value = profile.username;

  // mark mounted after client-only checks/requests complete
  mounted.value = true;
});

async function logout() {
  await supabase.auth.signOut();
  navigateTo("/");
}
</script>
