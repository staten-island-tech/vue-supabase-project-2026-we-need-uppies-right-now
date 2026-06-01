import { useSupabaseClient } from "#imports"

export default defineNuxtRouteMiddleware(async() => {
  const supabase = useSupabaseClient()
  const { data} = await supabase.auth.getSession()
  console.log(data)
  
  if (!data.session) {
    return navigateTo("/");
  }
})