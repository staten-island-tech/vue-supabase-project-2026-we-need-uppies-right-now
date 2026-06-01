<template>
  <div v-if="isAuthed">
    <button @click="logout">Logout</button>

    <div>
      <h1>Hello, {{ username }}!</h1>
      <button @click="navigateTo('/builder')">Start Building</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const supabase = useSupabaseClient();
const isAuthed = ref(false);
const username = ref("");

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
});

async function logout() {
  await supabase.auth.signOut();
  navigateTo("/");
}
</script>
