<template>
  <div v-if="isAuthed" class="h-screen w-full flex flex-col items-center justify-center">
    <div class="flex flex-col items-center text-center mb-5">
      <img src="/heytealogo.png" alt="Hey Tea Logo">
        <h1>Hello, {{ username }}!</h1>
        <button class="start-button" @click="navigateTo('/builder')">START BUILDING</button>
      <button @click="logout">Logout</button>
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

<style>
@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap');
</style>
