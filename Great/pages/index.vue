<template>
  <div class="h-screen w-full flex flex-col items-center justify-center mb-5">
    <img src="/heytealogo.png" alt="Hey Tea Logo">
    <h1>Who's making boba?</h1>
    <div class="flex flex-col gap-4 mb-8">
      <input v-model="email" placeholder="Email" type="email" />
      <input v-model="password" placeholder="Password" type="password" />
      <input v-model="username" placeholder="Username (signup only)" />
    </div>
    <button @click="login">Log In</button>
    <button @click="signup">Sign Up</button>
    <p v-if="errorMsg">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});
const supabase = useSupabaseClient();
const email = ref("");
const password = ref("");
const username = ref("");
const errorMsg = ref("");

async function login() {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  if (error) {
    errorMsg.value = error.message;
    return;
  }
  navigateTo("/dashboard");
}

async function signup() {
  if (!username.value.trim()) {
    errorMsg.value = "Username is required";
    return;
  }
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });
  if (error) {
    errorMsg.value = error.message;
    return;
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      username: username.value.trim(),
    });
    if (profileError)
      console.error("Profile insert failed:", profileError.message);
  }
  navigateTo("/builder");
}
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,100..700;1,100..700&display=swap');
</style>
